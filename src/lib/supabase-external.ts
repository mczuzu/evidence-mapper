// src/lib/supabase-external.ts
import { createClient } from "@supabase/supabase-js";

// Hardcoded credentials to bypass environment variable injection issues
const EXTERNAL_SUPABASE_URL = "https://dxtgnfmtuvxbpnvxzxal.supabase.co";
const EXTERNAL_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dGduZm10dXZ4YnBudnh6eGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NDI5NDQsImV4cCI6MjA1MzIxODk0NH0.E7DkNJaAfI2xjh3lcYxhH5lTdO-Y-V5VfPEbBqBjF0U";

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

// Client for Edge Functions invocation
export const supabaseExternalFunctions = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      Authorization: `Bearer ${EXTERNAL_SUPABASE_ANON_KEY}`,
    },
  },
});
