// src/lib/supabase-external.ts
import { createClient } from "@supabase/supabase-js";

// IMPORTANT:
// - These env vars must be set in Lovable (Secrets / Environment).
// - Values must be raw strings (NO "Bearer " prefix).

const EXTERNAL_SUPABASE_URL = (import.meta as any).env?.VITE_EXTERNAL_SUPABASE_URL as string | undefined;

const EXTERNAL_SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_EXTERNAL_SUPABASE_ANON_KEY as string | undefined;

function requireEnv(name: string, value: string | undefined) {
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is required. Set it in Lovable Secrets / Environment variables.`);
  }
  return value.trim();
}

const url = requireEnv("VITE_EXTERNAL_SUPABASE_URL", EXTERNAL_SUPABASE_URL);
const anonKey = requireEnv("VITE_EXTERNAL_SUPABASE_ANON_KEY", EXTERNAL_SUPABASE_ANON_KEY);

// Optional sanity check
if (!anonKey.startsWith("eyJ")) {
  console.warn(
    "[supabase-external] VITE_EXTERNAL_SUPABASE_ANON_KEY does not look like a JWT (expected to start with 'eyJ').",
  );
}

// Client for 'em' schema (study data)
export const supabaseExternal = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  db: { schema: 'em' },
});

// Client for 'public' schema (analysis_runs table)
export const supabaseExternalPublic = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  db: { schema: 'public' },
});

// Client for Edge Functions invocation
export const supabaseExternalFunctions = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
