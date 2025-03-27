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

// Fetch configuration from server
async function initializeSupabase() {
  try {
    // Prioritize config from server-side API
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        if (config?.supabase?.url && config?.supabase?.key) {
          console.log('Supabase configuration loaded from server API');
          
          // Create the actual client
          const options = {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true
            }
          };
          
          // Add site URL to config if available
          if (config.supabase.siteUrl) {
            console.log('Setting Supabase site URL to:', config.supabase.siteUrl);
            // @ts-ignore (redirectTo is valid but TypeScript definition might be outdated)
            options.auth.redirectTo = config.supabase.siteUrl;
          }
          
          supabase = createClient(config.supabase.url, config.supabase.key, options);
          
          console.log('Supabase client initialized successfully with API config');
          return;
        }
      }
    } catch (apiError) {
      console.error('Error fetching config from API:', apiError);
    }

    // Fallback to environment variables
    const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const envSupabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (envSupabaseUrl && envSupabaseKey) {
      const options = {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      };
      
      // @ts-ignore (redirectTo is valid but TypeScript definition might be outdated)
      options.auth.redirectTo = window.location.origin;
      
      supabase = createClient(envSupabaseUrl, envSupabaseKey, options);
      
      console.log('Supabase client initialized with environment variables');
      return;
    }
    
    console.error('Missing Supabase credentials from both API and environment');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    supabase = createMockClient();
  }
}

// Start the initialization process
initializeSupabase();

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