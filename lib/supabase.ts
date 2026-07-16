import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { secureStorage } from './secureStorage';

/**
 * Supabase client. Reads credentials from env (EXPO_PUBLIC_SUPABASE_URL /
 * EXPO_PUBLIC_SUPABASE_ANON_KEY). When they are absent the app runs in local
 * offline mode, so it always works in Expo Go before the backend is wired up.
 * Session tokens are persisted encrypted-at-rest via secureStorage.
 * See SUPABASE_SETUP.md.
 */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  url && anonKey && url.startsWith('http')
);

// Fail loudly in production if the backend wasn't configured, instead of
// silently shipping a local-only build with no cloud sync / real auth.
if (!__DEV__ && !isSupabaseConfigured) {
  console.warn(
    '[VitaCare] Supabase is not configured in a production build — running ' +
      'local-only (no cloud sync, no server-validated auth). Check ' +
      'EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        storage: secureStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
