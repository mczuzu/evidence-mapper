// src/lib/supabase-external.ts
import { createClient } from "@supabase/supabase-js";

// External Supabase (hardcoded to avoid env injection issues in Lovable)
export const EXTERNAL_SUPABASE_URL = "https://dxtgnfmtuvxbpnvxzxal.supabase.co";
export const EXTERNAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dGduZm10dXZ4YnBudnh6eGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4OTg0OTksImV4cCI6MjA4NDQ3NDQ5OX0.Reya82SFyWxJFwdHwAR_pdgttqKuAGyC3xxngwvTQto";

// Client for "em" schema (study data)
export const supabaseExternal = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  db: { schema: "em" },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Client for "public" schema (analysis_runs table)
export const supabaseExternalPublic = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  db: { schema: "public" },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Optional: supabase client for invoking edge functions (POST-based)
export const supabaseExternalFunctions = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      apikey: EXTERNAL_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${EXTERNAL_SUPABASE_ANON_KEY}`,
    },
  },
});
