-- =====================================================================
-- PayU POS Terminal Payments: Production Migration (v4)
-- =====================================================================
create extension if not exists pgcrypto;

-- 1. Store -> Terminal mapping
create table if not exists public.pharmacy_store_terminals (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references public.stores(id) on delete restrict,
  pos_device_id text not null,
  label         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (store_id, pos_device_id)
);

-- 2. Payment attempts
create table if not exists public.pharmacy_sale_payments (
  id                 uuid primary key default gen_random_uuid(),
  sale_id            uuid not null references public.pharmacy_direct_sales(id) on delete restrict,
  txn_id             text not null unique,
  amount             numeric(12,2) not null check (amount > 0),   -- INR charged on terminal
  original_amount    numeric(14,3) not null default 0,            -- sale total in SAR
  original_currency  text not null default 'SAR',
  fx_rate_to_inr     numeric(18,8) not null default 1,
  payment_method     text not null check (payment_method in ('card','upi')),
  pos_device_id      text not null,
  status             text not null default 'pending'
                       check (status in ('pending','success','failed','expired','cancelled','needs_review')),
  payu_payment_id    text,
  payu_reference_id  text,
  payu_mihpay_id     text,
  bank_ref_no        text,
  failure_reason     text,
  initiated_by       text not null,                               -- text allows 'demo-user-id' in dev
  expires_at         timestamptz not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  finalized_at       timestamptz
);

-- Ensure columns exist if table was already created in earlier draft
alter table public.pharmacy_sale_payments
  add column if not exists original_amount numeric(14,3) not null default 0,
  add column if not exists original_currency text not null default 'SAR',
  add column if not exists fx_rate_to_inr numeric(18,8) not null default 1;

create unique index if not exists uq_pharmacy_sale_payments_one_pending
  on public.pharmacy_sale_payments (sale_id) where status = 'pending';
create index if not exists idx_pharmacy_sale_payments_sale
  on public.pharmacy_sale_payments (sale_id, created_at desc);
create index if not exists idx_pharmacy_sale_payments_status
  on public.pharmacy_sale_payments (status, created_at);

create or replace function public.trg_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists touch_pharmacy_sale_payments on public.pharmacy_sale_payments;
create trigger touch_pharmacy_sale_payments
  before update on public.pharmacy_sale_payments
  for each row execute function public.trg_touch_updated_at();

-- 3. Audit Event Log
create table if not exists public.pharmacy_payment_events (
  id         bigserial primary key,
  txn_id     text,
  source     text not null check (source in ('initiate_request','initiate_response','webhook','check_status','manual')),
  payload    jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_pharmacy_payment_events_txn
  on public.pharmacy_payment_events (txn_id, created_at);

-- 4. Schema Enhancements on Sales Tables
alter table public.pharmacy_direct_sales
  add column if not exists pg_payment_id text,
  add column if not exists pos_completion_claimed_at timestamptz,
  add column if not exists jv_status text default 'pending';

alter table public.pharmacy_direct_sale_items
  add column if not exists unit text,
  add column if not exists batch_date date;

-- 5. Server-Side Batch Stock Sum (No 1000-Row Limit)
create or replace function public.get_batch_stock_balance(
  p_store_id uuid,
  p_item_id  uuid,
  p_batch_no text
) returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(stock_in_quantity) - sum(stock_out_quantity), 0)::numeric
    from public.inventory_stock_ledger
   where store_id = p_store_id
     and item_id = p_item_id
     and upper(trim(batch_no)) = upper(trim(p_batch_no));
$$;

-- 6. Finalize Payment Function (Service Role Only)
create or replace function public.finalize_pos_payment(
  p_txn_id    text,
  p_amount    numeric,
  p_bank_ref  text default null,
  p_mihpay_id text default null
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay public.pharmacy_sale_payments%rowtype;
begin
  select * into v_pay
    from public.pharmacy_sale_payments
   where txn_id = p_txn_id
   for update;

  if not found then return 'not_found'; end if;
  if v_pay.status = 'success' then return 'already_done'; end if;

  if v_pay.status in ('failed','expired','cancelled') then
    update public.pharmacy_sale_payments
       set status = 'needs_review',
           payu_mihpay_id = coalesce(p_mihpay_id, payu_mihpay_id),
           bank_ref_no    = coalesce(p_bank_ref, bank_ref_no),
           failure_reason = 'Payment confirmed by PayU after attempt was ' || v_pay.status
     where id = v_pay.id;
    return 'needs_review';
  end if;

  if v_pay.status = 'needs_review' then return 'needs_review'; end if;

  if p_amount is null then
    update public.pharmacy_sale_payments
       set status = 'needs_review',
           failure_reason = 'PayU confirmation did not include an amount'
     where id = v_pay.id;
    return 'amount_missing';
  end if;

  if abs(p_amount - v_pay.amount) > 0.01 then
    update public.pharmacy_sale_payments
       set status = 'needs_review',
           failure_reason = 'Amount mismatch: expected ' || v_pay.amount || ' got ' || p_amount
     where id = v_pay.id;
    return 'amount_mismatch';
  end if;

  update public.pharmacy_sale_payments
     set status         = 'success',
         payu_mihpay_id = coalesce(p_mihpay_id, payu_mihpay_id),
         bank_ref_no    = coalesce(p_bank_ref, bank_ref_no),
         finalized_at   = now()
   where id = v_pay.id;

  return 'finalized';
end $$;

-- 7. Completion Claim & Release Functions
create or replace function public.claim_pos_sale_completion(p_sale_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows int;
begin
  if not exists (
    select 1 from public.pharmacy_sale_payments
     where sale_id = p_sale_id and status = 'success'
  ) then
    return false;
  end if;

  update public.pharmacy_direct_sales
     set pos_completion_claimed_at = now()
   where id = p_sale_id
     and payment_status is distinct from 'paid'
     and (pos_completion_claimed_at is null
          or pos_completion_claimed_at < now() - interval '3 minutes');

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end $$;

create or replace function public.release_pos_sale_completion(p_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pharmacy_direct_sales
     set pos_completion_claimed_at = null
   where id = p_sale_id
     and payment_status is distinct from 'paid';
end $$;

-- 8. Lock Down Permissions
revoke all on function public.finalize_pos_payment(text, numeric, text, text)  from public, anon, authenticated;
revoke all on function public.claim_pos_sale_completion(uuid)                  from public, anon, authenticated;
revoke all on function public.release_pos_sale_completion(uuid)                from public, anon, authenticated;
revoke all on function public.get_batch_stock_balance(uuid, uuid, text)        from public, anon;

grant execute on function public.finalize_pos_payment(text, numeric, text, text) to service_role;
grant execute on function public.claim_pos_sale_completion(uuid)                 to service_role;
grant execute on function public.release_pos_sale_completion(uuid)               to service_role;
grant execute on function public.get_batch_stock_balance(uuid, uuid, text)        to authenticated, service_role;

alter table public.pharmacy_store_terminals enable row level security;
alter table public.pharmacy_sale_payments   enable row level security;
alter table public.pharmacy_payment_events  enable row level security;

revoke all on public.pharmacy_store_terminals from anon, authenticated;
revoke all on public.pharmacy_sale_payments   from anon, authenticated;
revoke all on public.pharmacy_payment_events  from anon, authenticated;

grant all on public.pharmacy_store_terminals to service_role;
grant all on public.pharmacy_sale_payments   to service_role;
grant all on public.pharmacy_payment_events  to service_role;
grant usage, select on sequence public.pharmacy_payment_events_id_seq to service_role;

