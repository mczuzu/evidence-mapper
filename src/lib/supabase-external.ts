import { createClient } from '@supabase/supabase-js';

// External Supabase project configuration
// IMPORTANT: Do not hardcode keys. These must come from Vite env vars.
export const EXTERNAL_SUPABASE_URL = (import.meta.env.VITE_EXTERNAL_SUPABASE_URL ?? '').trim();
// Non-secret fallback so the app can still run even if the Vite env var isn't injected yet.
// (Keys are NOT given fallbacks.)
export const EXTERNAL_SUPABASE_URL_FALLBACK = 'https://dxtgnfmtuvxbpnvxzxal.supabase.co';

export const externalSupabaseUrl = EXTERNAL_SUPABASE_URL || EXTERNAL_SUPABASE_URL_FALLBACK;

// The publishable key works for REST/PostgREST queries against the external DB.
// (This is a publishable key and is not considered a secret.)
export const EXTERNAL_SUPABASE_DB_KEY = 'sb_publishable_9XTutsu4Dmnk68u13bcPWA_VUIF2Kk0';

// The external project's anon public key (JWT-formatted). Required for Edge Function invocation.
export const EXTERNAL_SUPABASE_ANON_KEY = (import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY ?? '').trim();

export const hasExternalAnonJwtKey = EXTERNAL_SUPABASE_ANON_KEY.split('.').length === 3;

// Client for 'em' schema (study data)
export const supabaseExternal = createClient(externalSupabaseUrl, EXTERNAL_SUPABASE_DB_KEY, {
  db: {
    schema: 'em'
  }
});

// Client for 'public' schema (analysis_runs table)
export const supabaseExternalPublic = createClient(externalSupabaseUrl, EXTERNAL_SUPABASE_DB_KEY, {
  db: {
    schema: 'public'
  }
});

// Dedicated client for invoking Edge Functions on the external project.
// Uses the anon JWT key which is required for function invocation.
export const supabaseExternalFunctions = createClient(
  externalSupabaseUrl,
  EXTERNAL_SUPABASE_ANON_KEY
);
