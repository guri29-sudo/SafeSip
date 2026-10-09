import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/env';

/**
 * Supabase client — uses AsyncStorage for session persistence.
 * Session is restored on every app launch (no login required after first login).
 */
const safeUrl = SUPABASE_URL || 'https://placeholder.supabase.co';
const safeKey = SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    storage: AsyncStorage,
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
