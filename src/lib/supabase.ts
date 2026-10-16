import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Support both VITE_SUPABASE_PUBLISHABLE_KEY and legacy VITE_SUPABASE_ANON_KEY
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabasePublishableKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('placeholder') &&
    supabasePublishableKey.length > 10
  );
};

// Create the Supabase client singleton
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    })
  : null;

export const getSupabaseUrl = (): string => supabaseUrl || '';
export const getSupabasePublishableKey = (): string => supabasePublishableKey || '';
export const getSupabaseAnonKey = (): string => supabasePublishableKey || '';

/**
 * Returns the current authenticated user's access token, or the publishable key as fallback.
 * Essential for authenticating TUS resumable uploads against Supabase Storage.
 */
export const getActiveAccessToken = async (): Promise<string> => {
  if (!supabase) return getSupabasePublishableKey();
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return session.access_token;
    }
  } catch (err) {
    console.warn('Failed to retrieve active session access token:', err);
  }
  return getSupabasePublishableKey();
};

/**
 * Verifies if the authenticated user is an authorized administrator
 * by checking the secure `admin_users` table via RLS.
 */
export const checkIsUserAdmin = async (userId: string): Promise<boolean> => {
  if (!supabase || !userId) return false;
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      console.warn('Admin check query error:', error);
      return false;
    }
    return Boolean(data);
  } catch (err) {
    console.warn('Error checking admin status:', err);
    return false;
  }
};
