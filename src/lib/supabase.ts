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
 * Validates that a string is syntactically a valid compact JWS / JWT structure.
 * Compact JWS consists of three dot-separated Base64URL-encoded parts.
 */
export const isValidJwt = (token: string | null | undefined): boolean => {
  if (!token || typeof token !== 'string') return false;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return false;
  return parts[0].startsWith('eyJ') && parts[1].length > 0 && parts[2].length > 0;
};

/**
 * Extracts expiration timestamp (seconds) from JWT payload if available.
 */
export const getJwtExpiration = (token: string | null | undefined): number | null => {
  if (!isValidJwt(token) || typeof window === 'undefined') return null;
  try {
    const parts = (token || '').split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(window.atob(base64));
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
};

/**
 * Retrieves a valid, verified JWT access token for the authenticated administrator.
 * Automatically attempts to refresh the session if expired.
 * Returns null if no valid authenticated user session exists.
 * NEVER returns the publishable API key as a Bearer token.
 */
export const getActiveAccessToken = async (): Promise<string | null> => {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token && isValidJwt(session.access_token)) {
      // Check if token is expired or expiring in next 60 seconds
      const expiresAt = session.expires_at || getJwtExpiration(session.access_token);
      const now = Math.floor(Date.now() / 1000);
      if (expiresAt && expiresAt - now < 60) {
        // Token is expired or expiring soon, refresh it
        const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
        if (refreshData?.session?.access_token && isValidJwt(refreshData.session.access_token)) {
          return refreshData.session.access_token;
        }
        if (refreshErr) {
          console.warn('[Supabase Auth] Session refresh warning:', refreshErr.message);
        }
      }
      return session.access_token;
    }

    // Try explicit refresh if no active session in memory
    const { data: refreshData } = await supabase.auth.refreshSession();
    if (refreshData?.session?.access_token && isValidJwt(refreshData.session.access_token)) {
      return refreshData.session.access_token;
    }
  } catch (err) {
    console.warn('Failed to retrieve or refresh active session access token:', err);
  }
  return null;
};

/**
 * Retrieves the currently authenticated Supabase Auth user, if any.
 */
export const getCurrentAuthUser = async () => {
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
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
