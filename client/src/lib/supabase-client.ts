import { createClient } from '@supabase/supabase-js';

// The createClient function that can be used in components
export const createSupabaseClient = () => {
  // First try to get URL and key from window.__SUPABASE_CONFIG__
  // which is injected from the server
  if (
    typeof window !== 'undefined' && 
    window.__SUPABASE_CONFIG__ && 
    window.__SUPABASE_CONFIG__.url && 
    window.__SUPABASE_CONFIG__.key
  ) {
    return createClient(
      window.__SUPABASE_CONFIG__.url,
      window.__SUPABASE_CONFIG__.key
    );
  }

  // Fallback to environment variables (these won't typically be available in browser)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  console.error('Supabase URL and Anon Key must be defined');
  
  // Return a mock client that will log errors rather than crash
  return createClient(
    'https://example.com', 
    'example-key',
    {
      global: {
        fetch: (...args) => {
          console.error('Supabase client not properly initialized');
          return Promise.reject(new Error('Supabase client not properly initialized'));
        }
      }
    }
  );
};

// Add global type for window
declare global {
  interface Window {
    __SUPABASE_CONFIG__?: {
      url: string;
      key: string;
    };
  }
}

// Create a singleton instance
let _supabaseInstance: ReturnType<typeof createClient> | null = null;

// Export a singleton getter
export const getSupabaseClient = () => {
  if (!_supabaseInstance) {
    _supabaseInstance = createSupabaseClient();
  }
  return _supabaseInstance;
};

export default getSupabaseClient;