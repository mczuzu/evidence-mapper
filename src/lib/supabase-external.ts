import { createClient } from '@supabase/supabase-js';

// External Supabase project configuration (dxtgnfmtuvxbpnvxzxal)
export const EXTERNAL_SUPABASE_URL = 'https://dxtgnfmtuvxbpnvxzxal.supabase.co';

// The publishable key works for REST/PostgREST queries
export const EXTERNAL_SUPABASE_DB_KEY = 'sb_publishable_9XTutsu4Dmnk68u13bcPWA_VUIF2Kk0';

// The anon JWT key is required for Edge Function invocation (public, safe to include in frontend)
// This is the external project's standard anon key from Supabase dashboard > Settings > API
export const EXTERNAL_SUPABASE_ANON_JWT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dGduZm10dXZ4YnBudnh6eGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxMTA0OTIsImV4cCI6MjA1MTY4NjQ5Mn0.nh8XumLm_zMUwAdKu2Xb9ozs_LjbmhtJiSd8DJn7HZU';

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
// Uses the anon JWT key which is required for function invocation.
export const supabaseExternalFunctions = createClient(
  EXTERNAL_SUPABASE_URL,
  EXTERNAL_SUPABASE_ANON_JWT_KEY
);
