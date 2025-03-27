import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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