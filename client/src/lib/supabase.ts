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
    const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const envSupabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (envSupabaseUrl && envSupabaseKey) {
      console.log('Creating Supabase client with environment variables');
      
      supabase = createClient(
        envSupabaseUrl,
        envSupabaseKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );
      
      return;
    }
    
    // If all methods fail, use the mock client
    console.error('Failed to initialize Supabase with valid credentials');
    supabase = createMockClient();
    
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    supabase = createMockClient();
  }
}

// Initialize immediately
initializeSupabase();

// Add a debug helper to the window object
if (typeof window !== 'undefined') {
  // @ts-ignore - Adding to window for debugging
  window.checkSupabaseEnv = () => {
    console.log('Checking Supabase Environment Variables:');
    console.log('-------------------------------------');
    
    try {
      const viteSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const viteSupabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('VITE_SUPABASE_URL:', viteSupabaseUrl ? 
        `Found (${viteSupabaseUrl.substring(0, 12)}...)` : 'Not found or empty');
      console.log('VITE_SUPABASE_ANON_KEY:', viteSupabaseKey ? 
        `Found (${viteSupabaseKey.substring(0, 5)}...)` : 'Not found or empty');
      
      console.log('\nCurrent Supabase Client Status:');
      console.log('----------------------------');
      // @ts-ignore - Accessing private property for debugging
      const supabaseInternals = supabase.auth;
      console.log('Auth initialized:', !!supabaseInternals);
      
      console.log('\nLocal Storage Auth Items:');
      console.log('----------------------');
      const authItems = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          const value = localStorage.getItem(key);
          authItems.push({
            key,
            hasValue: !!value,
            preview: value ? `${value.substring(0, 15)}...` : 'empty'
          });
        }
      }
      console.table(authItems);
      
      return {
        hasUrl: !!viteSupabaseUrl,
        hasKey: !!viteSupabaseKey,
        authInitialized: !!supabaseInternals,
        localStorageItems: authItems.length
      };
    } catch (e: any) {
      console.error('Error in checkSupabaseEnv:', e);
      return { error: e.message };
    }
  };
  
  console.log('Debug helper added - run window.checkSupabaseEnv() in console to verify Supabase environment');
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