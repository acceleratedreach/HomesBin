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
      window.__SUPABASE_CONFIG__.key,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'supabase.auth.token',
          flowType: 'pkce',
          storage: {
            getItem: (key: string) => {
              try {
                // Try localStorage first
                let value = window.localStorage.getItem(key);
                if (!value) {
                  // If not in localStorage, try sessionStorage as backup
                  value = window.sessionStorage.getItem(key);
                }
                return value;
              } catch (e) {
                console.warn(`Error getting item from storage: ${key}`, e);
                return null;
              }
            },
            setItem: (key: string, value: string) => {
              try {
                // Store in both localStorage and sessionStorage for redundancy
                window.localStorage.setItem(key, value);
                window.sessionStorage.setItem(key, value);
              } catch (e) {
                console.warn(`Error setting item in storage: ${key}`, e);
                try {
                  window.sessionStorage.setItem(key, value);
                } catch (se) {
                  console.warn(`Error setting item in sessionStorage: ${key}`, se);
                }
              }
            },
            removeItem: (key: string) => {
              try {
                window.localStorage.removeItem(key);
                window.sessionStorage.removeItem(key);
              } catch (e) {
                console.warn(`Error removing item from storage: ${key}`, e);
              }
            }
          }
        }
      }
    );
  }

  // Fallback to environment variables (these won't typically be available in browser)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'supabase.auth.token',
        flowType: 'pkce',
        storage: {
          getItem: (key: string) => {
            try {
              // Try localStorage first
              let value = window.localStorage.getItem(key);
              if (!value) {
                // If not in localStorage, try sessionStorage as backup
                value = window.sessionStorage.getItem(key);
              }
              return value;
            } catch (e) {
              console.warn(`Error getting item from storage: ${key}`, e);
              return null;
            }
          },
          setItem: (key: string, value: string) => {
            try {
              // Store in both localStorage and sessionStorage for redundancy
              window.localStorage.setItem(key, value);
              window.sessionStorage.setItem(key, value);
            } catch (e) {
              console.warn(`Error setting item in storage: ${key}`, e);
              try {
                window.sessionStorage.setItem(key, value);
              } catch (se) {
                console.warn(`Error setting item in sessionStorage: ${key}`, se);
              }
            }
          },
          removeItem: (key: string) => {
            try {
              window.localStorage.removeItem(key);
              window.sessionStorage.removeItem(key);
            } catch (e) {
              console.warn(`Error removing item from storage: ${key}`, e);
            }
          }
        }
      }
    });
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
    
    // Log available auth methods on client creation for debugging
    try {
      const authMethods = Object.getOwnPropertyNames(_supabaseInstance.auth)
        .filter(name => typeof _supabaseInstance.auth[name] === 'function');
      console.log('SupabaseClient initialized with auth methods:', authMethods.join(', '));
      console.log('Has refreshSession:', authMethods.includes('refreshSession'));
      console.log('Has setSession:', authMethods.includes('setSession'));
      
      // Try to detect version from available methods
      const version = 
        authMethods.includes('setSession') && !authMethods.includes('refreshSession') 
          ? 'v2.x (latest)' 
          : authMethods.includes('refreshSession') 
            ? 'v2.5.0+' 
            : 'v2.0-v2.4.x';
            
      console.log('Detected Supabase client version:', version);
    } catch (e) {
      console.error('Error checking Supabase methods on init:', e);
    }
  }
  return _supabaseInstance;
};

export default getSupabaseClient;