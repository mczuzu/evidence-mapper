// src/lib/supabase-external.ts
import { createClient } from "@supabase/supabase-js";

// Hardcoded credentials to bypass environment variable injection issues
const EXTERNAL_SUPABASE_URL = "https://dxtgnfmtuvxbpnvxzxal.supabase.co";

// IMPORTANT:
// This MUST be the exact anon JWT that worked in your curl (HTTP 200).
// Copy it from Supabase Dashboard -> Edge Functions -> Secrets -> SUPABASE_ANON_KEY
// (or Project Settings -> API -> anon key, if it shows the JWT-form key).
const EXTERNAL_SUPABASE_ANON_KEY =
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

// Client for Edge Functions invocation
// NOTE: do NOT override Authorization headers here.
// supabase-js will include apikey + Authorization using the provided key.
export const supabaseExternalFunctions = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
