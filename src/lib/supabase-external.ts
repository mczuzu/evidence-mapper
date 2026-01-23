import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dxtgnfmtuvxbpnvxzxal.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9XTutsu4Dmnk68u13bcPWA_VUIF2Kk0';

export const supabaseExternal = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
