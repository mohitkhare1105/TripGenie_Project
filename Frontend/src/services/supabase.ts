import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://prkojotfmkspgmxqysdu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Retrieves the current verified access token from the Supabase client session.
 * Automatically refreshes expired or near-expiry tokens.
 * Returns null if no active session exists.
 */
export async function getValidAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) return null;

    // Check if token expires within 60 seconds and refresh if needed
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now + 60) {
      const { data: refreshed, error: refreshError } =
        await supabase.auth.refreshSession();
      if (!refreshError && refreshed.session?.access_token) {
        return refreshed.session.access_token;
      }
    }

    return session.access_token || null;
  } catch {
    return null;
  }
}
