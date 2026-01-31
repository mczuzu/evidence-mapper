import { createClient } from '@supabase/supabase-js';

// External Supabase project configuration (dxtgnfmtuvxbpnvxzxal)
export const EXTERNAL_SUPABASE_URL = 'https://dxtgnfmtuvxbpnvxzxal.supabase.co';

// NOTE:
// - The `sb_publishable_...` key works for the REST queries we run against the external DB.
// - BUT Edge Functions on that project are configured to require a *JWT* (otherwise they return 401 "Invalid JWT").
//   Therefore, to call `functions.invoke(...)` successfully, we must use the external project's **anon JWT key**.
//
// Configure it via env (preferred):
//   - VITE_EXTERNAL_SUPABASE_ANON_KEY (recommended)
//   - or VITE_SUPABASE_ANON_KEY (if you intentionally reuse that name)
//
// This is safe to expose in the frontend (it's a public anon key), but we still prefer env for flexibility.

export const EXTERNAL_SUPABASE_DB_KEY = 'sb_publishable_9XTutsu4Dmnk68u13bcPWA_VUIF2Kk0';

export const EXTERNAL_SUPABASE_ANON_JWT_KEY = (
  import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  ''
).trim();

export const hasExternalAnonJwtKey =
  EXTERNAL_SUPABASE_ANON_JWT_KEY.split('.').length === 3;

const EXTERNAL_SUPABASE_FUNCTIONS_KEY = hasExternalAnonJwtKey
  ? EXTERNAL_SUPABASE_ANON_JWT_KEY
  : EXTERNAL_SUPABASE_DB_KEY;

// Client for 'em' schema (study data)
export const supabaseExternal = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_DB_KEY, {
  db: {
    schema: 'em'
  }
});

// Client for 'public' schema (analysis_runs table)
export const supabaseExternalPublic = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_DB_KEY, {
  db: {
    schema: 'public'
  }
});

// Dedicated client for invoking Edge Functions on the external project.
// This MUST use a JWT-style key when functions enforce JWT verification.
export const supabaseExternalFunctions = createClient(
  EXTERNAL_SUPABASE_URL,
  EXTERNAL_SUPABASE_FUNCTIONS_KEY
);
