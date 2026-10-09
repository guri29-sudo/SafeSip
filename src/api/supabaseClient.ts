import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/env';

/**
 * Supabase client configuration.
 * Credentials are loaded safely from ../config/env (or local/CI environment).
 */
const safeUrl = SUPABASE_URL || 'https://placeholder.supabase.co';
const safeKey = SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

/**
 * Returns true only if real Supabase credentials have been configured.
 * When false, the app runs in local-only / offline mode.
 */
export const isSupabaseConfigured = (): boolean =>
  Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('placeholder') &&
    !SUPABASE_URL.includes('YOUR_PROJECT_REF') &&
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_URL.includes('.supabase.co')
  );

