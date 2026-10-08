import { createClient } from '@supabase/supabase-js';

// Environment variables or fallback credentials
const SUPABASE_URL = 'https://safesip-water-quality.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.SafeSipAnonymousAccessKeySecureProduction2026';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
