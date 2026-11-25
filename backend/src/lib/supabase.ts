import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const FALLBACK_URL = 'https://wbjtdhtvzlefzjvwhkui.supabase.co';
const supabaseUrl = (process.env.SUPABASE_URL || FALLBACK_URL).trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

if (!supabaseServiceKey) {
  console.warn('[Supabase Admin] Missing SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY in environment');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || 'no-key-set', {
  auth: { persistSession: false },
});

