-- ============================================================
-- Migration: Offline Continuity & Stock Reconciliation
-- HIS-WEB5 Pharmacy Module
-- ============================================================
-- Run this during a scheduled maintenance window.
-- The ALTER COLUMN ... SET NOT NULL steps acquire an
-- AccessExclusiveLock on Postgres and will block concurrent
-- reads/writes for the duration on large tables.
-- ============================================================

-- -------------------------------------------------------
-- 1. Extend inventory_stock_ledger with offline columns
-- -------------------------------------------------------
ALTER TABLE inventory_stock_ledger
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'live'
    CHECK (source IN ('live', 'offline_excel', 'offline_manual')),
  ADD COLUMN IF NOT EXISTS reference_no text,
  ADD COLUMN IF NOT EXISTS needs_reconciliation boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sale_id uuid REFERENCES pharmacy_direct_sales(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by text,
  -- Separates actual dispense time from system-recording time.
  -- Offline inserts MUST supply the real dispensed timestamp; live inserts default to NOW().
  ADD COLUMN IF NOT EXISTS transaction_date timestamp with time zone,
  -- Links each ledger row to the offline backlog batch it came from. NULL for all live sales.
  ADD COLUMN IF NOT EXISTS backlog_batch_id uuid;

-- Back-fill transaction_date for all existing rows before enforcing NOT NULL.
UPDATE inventory_stock_ledger
SET transaction_date = created_at
WHERE transaction_date IS NULL;

-- NOTE: ALTER COLUMN ... SET NOT NULL requests an AccessExclusiveLock on Postgres.
-- For tables with high row counts, run this step during a maintenance window
-- or use: ALTER TABLE ... ADD CONSTRAINT ck_txn_date_nn CHECK (transaction_date IS NOT NULL) NOT VALID;
--         then: ALTER TABLE ... VALIDATE CONSTRAINT ck_txn_date_nn; (concurrent-safe)
ALTER TABLE inventory_stock_ledger
  ALTER COLUMN transaction_date SET NOT NULL,
  ALTER COLUMN transaction_date SET DEFAULT now();

-- Partial unique index: deduplicate reference_no per store at DB level (not just app level).
-- Prevents race-condition double-inserts that slip past application-layer checks.
CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_ledger_store_reference_no
  ON inventory_stock_ledger (store_id, reference_no)
  WHERE reference_no IS NOT NULL;

-- -------------------------------------------------------
-- 2. Store connection status tracking
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS pharmacy_store_status (
  store_id             uuid PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
  status               text NOT NULL DEFAULT 'live'
                         CHECK (status IN ('live', 'offline', 'reconciliation_required')),
  -- Populated from client-reported detection time (primary).
  -- Falls back to server heartbeat timeout if client never reported.
  went_offline_at      timestamp with time zone,
  went_offline_source  text CHECK (went_offline_source IN ('client_detected', 'server_heartbeat_timeout')),
  reconnected_at       timestamp with time zone,
  reconciliation_cleared_at timestamp with time zone,
  updated_at           timestamp with time zone DEFAULT now()
);

-- -------------------------------------------------------
-- 3. Stock balance cache (refreshed on every ledger insert)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_stock_balance_cache (
  item_id         uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  batch_no        text NOT NULL,
  store_id        uuid REFERENCES stores(id) ON DELETE CASCADE,
  current_qty     numeric(10,2) NOT NULL DEFAULT 0,
  last_ledger_id  uuid REFERENCES inventory_stock_ledger(id) ON DELETE SET NULL,
  updated_at      timestamp with time zone DEFAULT now(),
  PRIMARY KEY (item_id, batch_no, store_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_balance_cache_item_batch_store
  ON inventory_stock_balance_cache (item_id, batch_no, store_id);

-- -------------------------------------------------------
-- 4. Offline backlog batch tracking
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS pharmacy_offline_backlog_batches (
  id                     uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id               uuid REFERENCES stores(id) ON DELETE CASCADE,
  outage_started_at      timestamp with time zone NOT NULL,
  outage_ended_at        timestamp with time zone NOT NULL,
  outage_started_source  text CHECK (outage_started_source IN ('client_detected', 'server_heartbeat_timeout')),
  upload_method          text CHECK (upload_method IN ('excel', 'manual', 'declared_empty')),
  uploaded_by            text,
  total_rows             integer DEFAULT 0,
  rows_flagged           integer DEFAULT 0,
  status                 text DEFAULT 'processing'
                           CHECK (status IN ('processing', 'completed', 'completed_with_flags')),
  created_at             timestamp with time zone DEFAULT now(),
  completed_at           timestamp with time zone
);

-- Wire FK from ledger -> backlog batch (table must exist first)
ALTER TABLE inventory_stock_ledger
  ADD CONSTRAINT fk_stock_ledger_backlog_batch
  FOREIGN KEY (backlog_batch_id) REFERENCES pharmacy_offline_backlog_batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stock_ledger_backlog_batch
  ON inventory_stock_ledger (backlog_batch_id);

-- -------------------------------------------------------
-- 5. Extend pharmacy_direct_sales with dispense-time audit
-- -------------------------------------------------------
ALTER TABLE pharmacy_direct_sales
  ADD COLUMN IF NOT EXISTS dispensed_at   timestamp with time zone,
  ADD COLUMN IF NOT EXISTS source         text NOT NULL DEFAULT 'live'
                                            CHECK (source IN ('live', 'offline_excel', 'offline_manual')),
  ADD COLUMN IF NOT EXISTS backlog_batch_id uuid
                                            REFERENCES pharmacy_offline_backlog_batches(id) ON DELETE SET NULL;

-- Back-fill dispensed_at for existing rows
UPDATE pharmacy_direct_sales
SET dispensed_at = created_at
WHERE dispensed_at IS NULL;

-- NOTE: Same AccessExclusiveLock caveat applies here.
ALTER TABLE pharmacy_direct_sales
  ALTER COLUMN dispensed_at SET NOT NULL,
  ALTER COLUMN dispensed_at SET DEFAULT now();
