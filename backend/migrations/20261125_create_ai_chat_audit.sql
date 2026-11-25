-- Migration: Create ai_chat_audit table for the AI Chat Assistant feature
-- Run this against your Supabase project (SQL Editor or CLI)
-- Date: 2026-11-25

CREATE TABLE IF NOT EXISTS ai_chat_audit (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      text        NOT NULL,
  role         text,
  user_message text,
  tool_name    text,
  tool_args    jsonb,
  patient_id   uuid,
  status       text        DEFAULT 'ok',  -- 'ok' | 'denied' | 'error'
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_audit_user    ON ai_chat_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_audit_patient ON ai_chat_audit(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_audit_created ON ai_chat_audit(created_at);

-- Audit log must NOT be readable via the public/anon key.
-- Only the service-role key (backend) can access it.
ALTER TABLE ai_chat_audit ENABLE ROW LEVEL SECURITY;
-- Intentionally NO SELECT/INSERT/UPDATE/DELETE policies:
-- supabaseAdmin (service-role) bypasses RLS entirely.
-- Anon and authenticated Supabase users cannot read or write this table.

