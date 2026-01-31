import { createClient } from '@supabase/supabase-js';

// External Supabase project configuration (dxtgnfmtuvxbpnvxzxal)
export const EXTERNAL_SUPABASE_URL = 'https://dxtgnfmtuvxbpnvxzxal.supabase.co';
export const EXTERNAL_SUPABASE_ANON_KEY = 'sb_publishable_9XTutsu4Dmnk68u13bcPWA_VUIF2Kk0';

// Client for 'em' schema (study data)
export const supabaseExternal = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  db: {
    schema: 'em'
  }
});

// Client for 'public' schema (analysis_runs table)
export const supabaseExternalPublic = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  db: {
    schema: 'public'
  }
});
