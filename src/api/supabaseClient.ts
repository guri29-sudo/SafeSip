import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/env';

/**
 * In-memory fallback storage for React Native when AsyncStorage is not linked.
 * Prevents "localStorage is not available" crashes.
 */
const memoryStorage = {
  data: {} as Record<string, string>,
  getItem: (key: string) => memoryStorage.data[key] ?? null,
  setItem: (key: string, value: string) => { memoryStorage.data[key] = value; },
  removeItem: (key: string) => { delete memoryStorage.data[key]; },
};

/**
 * Supabase client configuration.
 * Credentials are loaded safely from ../config/env (or local/CI environment).
 */
const safeUrl = SUPABASE_URL || 'https://placeholder.supabase.co';
const safeKey = SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    storage: memoryStorage,
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

