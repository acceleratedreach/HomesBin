import { createClient } from '@supabase/supabase-js';

// Initialize with a placeholder to avoid TypeScript errors
let supabase: ReturnType<typeof createClient>;

// Create a mock client for development that won't throw errors
const createMockClient = () => {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          limit: () => ({
            order: () => ({ data: [], error: null })
          })
        }),
        order: () => ({ data: [], error: null }),
        limit: () => ({
          order: () => ({ data: [], error: null })
        })
      })
    }),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signUp: async () => ({ data: null, error: null }),
      signInWithPassword: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null })
    }
  } as any;
};

// Initialize with mock client that will be replaced after fetching config
supabase = createMockClient();

// Initialize with config from server
async function initializeSupabase() {
  try {
    console.log('Initializing Supabase client...');
    
    // Get configuration from the server - this is the most reliable method
    try {
      console.log('Fetching Supabase config from server API...');
      const response = await fetch('/api/config');
      
      if (response.ok) {
        const config = await response.json();
        
        // Log the actual raw config for debugging
        console.log('Received config from server:', JSON.stringify(config));
        
        // Extract Supabase credentials
        const supabaseUrl = config?.supabase?.url;
        const supabaseKey = config?.supabase?.key;
        
        // Log specific credential check
        console.log('Config extraction check:', { 
          hasUrl: !!supabaseUrl, 
          hasKey: !!supabaseKey,
          urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 8)}...` : 'missing',
          keyValue: supabaseKey ? `${supabaseKey.substring(0, 5)}...` : 'missing'
        });
        
        // Strict type check for empty strings too
        if (supabaseUrl && supabaseKey && typeof supabaseUrl === 'string' && typeof supabaseKey === 'string') {
          console.log('Supabase configuration loaded from server API');
          
          // Set up window global config for debugging and potential reuse
          if (typeof window !== 'undefined') {
            window.__SUPABASE_CONFIG__ = {
              url: supabaseUrl,
              key: supabaseKey
            };
          }
          
          // Create the client with server-provided credentials
          supabase = createClient(
            supabaseUrl,
            supabaseKey,
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
                      console.log(`Storage get [${key.substring(0, 10)}...]: ${value ? 'exists' : 'null'}`);
                      return value;
                    } catch (e) {
                      console.warn(`Error getting item from storage: ${key}`, e);
                      return null;
                    }
                  },
                  setItem: (key: string, value: string) => {
                    try {
                      console.log(`Storage set [${key.substring(0, 10)}...]: ${value ? 'value exists' : 'null'}`);
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
                      console.log(`Storage remove [${key.substring(0, 10)}...]`);
                      window.localStorage.removeItem(key);
                      window.sessionStorage.removeItem(key);
                    } catch (e) {
                      console.warn(`Error removing item from storage: ${key}`, e);
                    }
                  },
                },
              },
              global: {
                headers: {
                  'X-Client-Info': 'supabase-js-web'
                }
              }
            }
          );
          
          // Log successful initialization
          console.log('Supabase client initialized successfully with API config');
          
          // Try to immediately check if the client works
          try {
            const { data, error } = await supabase.auth.getSession();
            console.log('Initial session check:', {
              success: !error,
              hasSession: !!data?.session,
              error: error ? error.message : null
            });
          } catch (sessionError) {
            console.error('Error checking session after initialization:', sessionError);
          }
          
          return;
        } else {
          console.error('Server returned config but missing Supabase URL or key:', {
            urlPresent: !!supabaseUrl,
            keyPresent: !!supabaseKey,
            urlType: typeof supabaseUrl,
            keyType: typeof supabaseKey
          });
        }
      } else {
        console.error('Failed to fetch Supabase config from server:', response.status, response.statusText);
        try {
          const errorText = await response.text();
          console.error('Error response:', errorText.substring(0, 200));
        } catch (e) {
          console.error('Could not extract error text');
        }
      }
    } catch (apiError) {
      console.error('Error fetching config from API:', apiError);
    }
    
    // Fallback to environment variables if server config fails
    // Try multiple environment variable formats
    let envSupabaseUrl = null;
    let envSupabaseKey = null;
    
    // Check for Vite environment variables (VITE_*)
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.log('Found Vite environment variables');
      envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      envSupabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    } 
    // Check for React environment variables (REACT_APP_*)
    else if (import.meta.env.REACT_APP_SUPABASE_URL && import.meta.env.REACT_APP_SUPABASE_ANON_KEY) {
      console.log('Found React environment variables');
      envSupabaseUrl = import.meta.env.REACT_APP_SUPABASE_URL;
      envSupabaseKey = import.meta.env.REACT_APP_SUPABASE_ANON_KEY;
    }
    // Check for direct environment variables without prefix
    else if (import.meta.env.SUPABASE_URL && import.meta.env.SUPABASE_ANON_KEY) {
      console.log('Found direct environment variables');
      envSupabaseUrl = import.meta.env.SUPABASE_URL;
      envSupabaseKey = import.meta.env.SUPABASE_ANON_KEY;
    }
    // Check for Replit-specific environment variables
    else if (import.meta.env.REPLIT_SUPABASE_URL && import.meta.env.REPLIT_SUPABASE_ANON_KEY) {
      console.log('Found Replit-specific environment variables');
      envSupabaseUrl = import.meta.env.REPLIT_SUPABASE_URL;
      envSupabaseKey = import.meta.env.REPLIT_SUPABASE_ANON_KEY;
    }
    
    // Log all available environment variables for debugging (excluding values)
    const envKeys = Object.keys(import.meta.env);
    console.log('Available environment variables:', envKeys.filter(k => 
      !k.includes('KEY') && !k.includes('SECRET') && !k.includes('PASSWORD')
    ).join(', '));
    
    // Check for Supabase URL pattern in any environment variable
    if (!envSupabaseUrl) {
      for (const key of envKeys) {
        const value = import.meta.env[key];
        if (
          typeof value === 'string' &&
          !key.includes('KEY') && 
          value.includes('supabase.co')
        ) {
          console.log(`Found potential Supabase URL in ${key}`);
          envSupabaseUrl = value;
          break;
        }
      }
    }
    
    // Check for Supabase key pattern in any environment variable
    if (!envSupabaseKey) {
      for (const key of envKeys) {
        const value = import.meta.env[key];
        if (
          typeof value === 'string' &&
          (key.includes('KEY') || key.includes('TOKEN')) && 
          value.length > 20 &&
          value.includes('eyJ')
        ) {
          console.log(`Found potential Supabase key in ${key}`);
          envSupabaseKey = value;
          break;
        }
      }
    }
    
    // Try localStorage as last resort (might have been set by another tab/session)
    if (!envSupabaseUrl || !envSupabaseKey) {
      try {
        const storedUrl = localStorage.getItem('supabase_url');
        const storedKey = localStorage.getItem('supabase_key');
        
        if (storedUrl && storedKey) {
          console.log('Found Supabase credentials in localStorage');
          envSupabaseUrl = storedUrl;
          envSupabaseKey = storedKey;
        }
      } catch (e) {
        console.warn('Error accessing localStorage for Supabase credentials:', e);
      }
    }
    
    // Hard-coded values from .env.local as absolute last resort
    // These should match what's in your .env.local file
    if (!envSupabaseUrl || !envSupabaseKey) {
      console.warn('No environment variables found, using fallback values');
      envSupabaseUrl = 'https://wgwlpmlfhirxbdtseure.supabase.co';
      envSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indnd2xwbWxmaGlyeGJkdHNldXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzc4MjYsImV4cCI6MjA1ODYxMzgyNn0.XrGQO_yiuq-UzK70vWiFSa_nUOdDKEmKwoPN8TU7_7w';
    }
    
    // Final check if we have credentials after all fallbacks
    if (envSupabaseUrl && envSupabaseKey) {
      console.log('Creating Supabase client with environment variables');
      console.log('URL Preview:', envSupabaseUrl.substring(0, 15) + '...');
      console.log('Key Preview:', envSupabaseKey.substring(0, 5) + '...');
      
      // Store for potential reuse in other sessions/tabs
      try {
        localStorage.setItem('supabase_url', envSupabaseUrl);
        localStorage.setItem('supabase_key', envSupabaseKey);
      } catch (e) {
        console.warn('Failed to store Supabase credentials in localStorage:', e);
      }
      
      // Create client with our comprehensive auth options
      supabase = createClient(
        envSupabaseUrl,
        envSupabaseKey,
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
              },
            }
          },
          global: {
            headers: {
              'X-Client-Info': 'supabase-js-web'
            }
          }
        }
      );
      
      // Try to immediately check if the client works
      try {
        const { data, error } = await supabase.auth.getSession();
        console.log('Session check with env vars:', {
          success: !error,
          hasSession: !!data?.session,
          error: error ? error.message : null
        });
      } catch (sessionError) {
        console.error('Error checking session after env var initialization:', sessionError);
      }
      
      return;
    }
    
    // If all methods fail, use the mock client
    console.error('Failed to initialize Supabase with valid credentials after trying all fallback methods');
    supabase = createMockClient();
    
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    supabase = createMockClient();
  }
}

// Initialize immediately
initializeSupabase();

// Add debug helpers to the window object
if (typeof window !== 'undefined') {
  /**
   * Comprehensive environment variable checker
   * This function checks all possible environment variable sources
   */
  // @ts-ignore - Adding to window for debugging
  window.checkSupabaseEnv = () => {
    console.log('📊 Supabase Environment Diagnostics');
    console.log('==================================');
    
    try {
      // Check all possible environment variable formats
      const envVariables = {
        // Vite variables
        vite: {
          url: import.meta.env.VITE_SUPABASE_URL,
          key: import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        // React variables
        react: {
          url: import.meta.env.REACT_APP_SUPABASE_URL,
          key: import.meta.env.REACT_APP_SUPABASE_ANON_KEY
        },
        // Direct variables
        direct: {
          url: import.meta.env.SUPABASE_URL,
          key: import.meta.env.SUPABASE_ANON_KEY
        },
        // Replit-specific variables
        replit: {
          url: import.meta.env.REPLIT_SUPABASE_URL,
          key: import.meta.env.REPLIT_SUPABASE_ANON_KEY
        }
      };
      
      // Display environment variable status
      console.log('Environment Variables:');
      console.log('---------------------');
      Object.entries(envVariables).forEach(([source, vars]) => {
        console.log(`${source.toUpperCase()}:`);
        console.log(`  URL: ${vars.url ? `Found (${vars.url.substring(0, 12)}...)` : 'Not found'}`);
        console.log(`  Key: ${vars.key ? `Found (${vars.key.substring(0, 5)}...)` : 'Not found'}`);
      });
      
      // Check for stored credentials
      const storedUrl = localStorage.getItem('supabase_url');
      const storedKey = localStorage.getItem('supabase_key');
      
      console.log('\nStored Credentials:');
      console.log('------------------');
      console.log(`localStorage URL: ${storedUrl ? `Found (${storedUrl.substring(0, 12)}...)` : 'Not found'}`);
      console.log(`localStorage Key: ${storedKey ? `Found (${storedKey.substring(0, 5)}...)` : 'Not found'}`);
      
      // Check client initialization
      console.log('\nSupabase Client Status:');
      console.log('----------------------');
      
      // @ts-ignore - Accessing for debugging
      const supabaseInternals = supabase.auth;
      const isInitialized = !!supabaseInternals;
      console.log(`Client initialized: ${isInitialized ? '✅ Yes' : '❌ No'}`);
      
      // Try a test API call
      console.log('\nSupabase Connectivity Test:');
      console.log('-------------------------');
      console.log('Testing connection... (see results below)');
      
      // Async test that will complete after this function returns
      supabase.auth.getSession().then(({ data, error }) => {
        console.log(`Connection test: ${!error ? '✅ Success' : '❌ Failed'}`);
        if (error) {
          console.error('Connection error:', error.message);
        } else {
          console.log(`Session exists: ${data?.session ? '✅ Yes' : '❓ No'}`);
        }
      });
      
      // Check for auth tokens in storage
      console.log('\nAuth Token Storage:');
      console.log('-----------------');
      
      // Look through localStorage
      const localStorageTokens = scanTokensInStorage('localStorage', localStorage);
      
      // Look through sessionStorage
      const sessionStorageTokens = scanTokensInStorage('sessionStorage', sessionStorage);
      
      // Check for cookies that might contain tokens
      const cookieTokens = document.cookie.split(';')
        .filter(cookie => 
          cookie.trim().startsWith('sb-') || 
          cookie.includes('supabase') || 
          cookie.includes('auth')
        ).map(cookie => {
          const [name, value] = cookie.split('=').map(part => part.trim());
          return { source: 'cookie', name, hasValue: !!value };
        });
      
      if (cookieTokens.length > 0) {
        console.log('Cookie auth tokens:');
        console.table(cookieTokens);
      } else {
        console.log('No auth tokens found in cookies');
      }
      
      // Return diagnostic summary
      return {
        environment: {
          vite: !!envVariables.vite.url && !!envVariables.vite.key,
          react: !!envVariables.react.url && !!envVariables.react.key,
          direct: !!envVariables.direct.url && !!envVariables.direct.key,
          replit: !!envVariables.replit.url && !!envVariables.replit.key,
        },
        storage: {
          localStorage: !!storedUrl && !!storedKey,
          tokenCount: localStorageTokens.length + sessionStorageTokens.length + cookieTokens.length
        },
        client: {
          initialized: isInitialized
        },
        timestamp: new Date().toISOString()
      };
    } catch (e: any) {
      console.error('Error in environment diagnostics:', e);
      return { error: e.message };
    }
  };
  
  // Helper function to scan storage for auth tokens
  function scanTokensInStorage(storageName: string, storageObject: Storage) {
    const tokens = [];
    try {
      for (let i = 0; i < storageObject.length; i++) {
        const key = storageObject.key(i);
        if (key && (
          key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('auth')
        )) {
          const value = storageObject.getItem(key);
          tokens.push({
            source: storageName,
            key,
            hasValue: !!value,
            preview: value ? `${value.substring(0, 10)}...` : 'empty'
          });
        }
      }
      
      if (tokens.length > 0) {
        console.log(`${storageName} auth tokens:`);
        console.table(tokens);
      } else {
        console.log(`No auth tokens found in ${storageName}`);
      }
    } catch (e) {
      console.error(`Error scanning ${storageName}:`, e);
    }
    
    return tokens;
  }
  
  /**
   * Auth cleanup helper function
   * This function helps clean up all Supabase-related storage
   */
  // @ts-ignore - Adding to window for debugging
  window.cleanSupabaseAuth = () => {
    console.log('🧹 Cleaning up Supabase Authentication Data');
    console.log('=========================================');
    
    try {
      // Track what we removed
      const removed = {
        localStorage: 0,
        sessionStorage: 0,
        cookies: 0
      };
      
      // Clean localStorage
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (
            key.includes('supabase') || 
            key.includes('sb-') || 
            key.includes('auth')
          )) {
            localStorage.removeItem(key);
            removed.localStorage++;
          }
        }
        console.log(`Cleaned ${removed.localStorage} items from localStorage`);
      } catch (e) {
        console.error('Error cleaning localStorage:', e);
      }
      
      // Clean sessionStorage
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i);
          if (key && (
            key.includes('supabase') || 
            key.includes('sb-') || 
            key.includes('auth')
          )) {
            sessionStorage.removeItem(key);
            removed.sessionStorage++;
          }
        }
        console.log(`Cleaned ${removed.sessionStorage} items from sessionStorage`);
      } catch (e) {
        console.error('Error cleaning sessionStorage:', e);
      }
      
      // Clean cookies
      try {
        document.cookie.split(';').forEach(cookie => {
          const key = cookie.split('=')[0].trim();
          if (
            key.includes('supabase') || 
            key.includes('sb-') || 
            key.includes('auth')
          ) {
            document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
            removed.cookies++;
          }
        });
        console.log(`Cleaned ${removed.cookies} cookies`);
      } catch (e) {
        console.error('Error cleaning cookies:', e);
      }
      
      // Force sign out
      try {
        supabase.auth.signOut().then(() => {
          console.log('Signed out from Supabase');
        }).catch(e => {
          console.error('Error signing out:', e);
        });
      } catch (e) {
        console.error('Error initiating sign out:', e);
      }
      
      return {
        success: true,
        removed
      };
    } catch (e: any) {
      console.error('Error in clean up:', e);
      return { 
        success: false, 
        error: e.message 
      };
    }
  };
  
  // Add instructions to console
  console.log('Debug tools added to window:');
  console.log('• window.checkSupabaseEnv() - Verify environment setup');
  console.log('• window.cleanSupabaseAuth() - Clean up auth tokens');
}

export { supabase };

/**
 * Fetch data from a Supabase table with optional filters
 * @param table Table name to query
 * @param options Query options including filters, pagination, etc.
 * @returns Query result
 */
export const fetchFromSupabase = async (
  table: string, 
  options: { 
    filters?: Record<string, any>,
    page?: number,
    pageSize?: number,
    orderBy?: string,
    orderDirection?: 'asc' | 'desc'
  } = {}
) => {
  const {
    filters = {},
    page = 1,
    pageSize = 20,
    orderBy = 'created_at',
    orderDirection = 'desc'
  } = options;
  
  let query = supabase
    .from(table)
    .select('*');
  
  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });
  
  // Apply pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  query = query.range(start, end);
  
  // Apply ordering
  query = query.order(orderBy, { ascending: orderDirection === 'asc' });
  
  const { data, error } = await query;
  
  if (error) {
    console.error(`Error fetching from ${table}:`, error);
    throw error;
  }
  
  return data;
};

/**
 * Insert a record into a Supabase table
 * @param table Table name
 * @param data Record data
 * @returns Inserted record
 */
export const insertToSupabase = async (table: string, data: any) => {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select('*')
    .single();
  
  if (error) {
    console.error(`Error inserting into ${table}:`, error);
    throw error;
  }
  
  return result;
};

/**
 * Update a record in a Supabase table
 * @param table Table name
 * @param id Record ID
 * @param data Updated data
 * @returns Updated record
 */
export const updateInSupabase = async (table: string, id: number | string, data: any) => {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) {
    console.error(`Error updating in ${table}:`, error);
    throw error;
  }
  
  return result;
};

/**
 * Delete a record from a Supabase table
 * @param table Table name
 * @param id Record ID
 * @returns Success status
 */
export const deleteFromSupabase = async (table: string, id: number | string) => {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting from ${table}:`, error);
    throw error;
  }
  
  return true;
};

/**
 * Fetch a single record by ID
 * @param table Table name
 * @param id Record ID
 * @returns Record data
 */
export const fetchOneFromSupabase = async (table: string, id: number | string) => {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching from ${table}:`, error);
    throw error;
  }
  
  return data;
};