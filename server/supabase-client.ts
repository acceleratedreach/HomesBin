import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}

// Create a single supabase client for the server
// Define a type for our mock Supabase client
type MockSupabaseClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: any) => {
        single: () => Promise<{ data: any | null, error: any | null }>;
        limit: (n: number) => {
          order: (column: string, options?: any) => Promise<{ data: any[], error: any | null }>;
        };
      };
      order: (column: string, options?: any) => Promise<{ data: any[], error: any | null }>;
      limit: (n: number) => {
        order: (column: string, options?: any) => Promise<{ data: any[], error: any | null }>;
      };
    };
  };
  auth: {
    signUp: (credentials: any) => Promise<{ data: any | null, error: any | null }>;
    signIn: (credentials: any) => Promise<{ data: any | null, error: any | null }>;
    signOut: () => Promise<{ error: any | null }>;
  };
};

let supabase: ReturnType<typeof createClient> | MockSupabaseClient;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Using mock Supabase client as credentials are missing');
    // Create a mock client that won't throw errors
    supabase = {
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
        signUp: async () => ({ data: null, error: null }),
        signIn: async () => ({ data: null, error: null }),
        signOut: async () => ({ error: null })
      }
    } as MockSupabaseClient;
  } else {
    supabase = createClient(
      supabaseUrl,
      supabaseAnonKey
    );
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Create a minimal mock client
  supabase = { 
    from: () => ({ 
      select: () => ({ data: [], error: null }) 
    })
  } as unknown as MockSupabaseClient;
}

export { supabase };

/**
 * A service class for Supabase operations on the server side
 */
export class SupabaseService {
  /**
   * Get all records from a table with optional filters
   */
  static async getAll(tableName: string, options: {
    filters?: Record<string, any>,
    select?: string,
    orderBy?: string,
    orderDirection?: 'asc' | 'desc',
    limit?: number
  } = {}) {
    const {
      filters = {},
      select = '*',
      orderBy = 'created_at',
      orderDirection = 'desc',
      limit
    } = options;

    let query = supabase
      .from(tableName)
      .select(select);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // Apply ordering
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Apply limit if provided
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching from ${tableName}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Get a single record by ID
   */
  static async getById(tableName: string, id: number | string, select: string = '*') {
    const { data, error } = await supabase
      .from(tableName)
      .select(select)
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching from ${tableName}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Insert a record
   */
  static async insert(tableName: string, data: any) {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select('*')
      .single();

    if (error) {
      console.error(`Error inserting into ${tableName}:`, error);
      throw error;
    }

    return result;
  }

  /**
   * Update a record
   */
  static async update(tableName: string, id: number | string, data: any) {
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error(`Error updating in ${tableName}:`, error);
      throw error;
    }

    return result;
  }

  /**
   * Delete a record
   */
  static async delete(tableName: string, id: number | string) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting from ${tableName}:`, error);
      throw error;
    }

    return true;
  }

  /**
   * Count records with optional filters
   */
  static async count(tableName: string, filters: Record<string, any> = {}) {
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { count, error } = await query;

    if (error) {
      console.error(`Error counting in ${tableName}:`, error);
      throw error;
    }

    return count;
  }

  /**
   * Run a custom query using Supabase's query builder
   */
  static async customQuery(queryBuilder: (query: any) => any) {
    try {
      const result = await queryBuilder(supabase);
      return result;
    } catch (error) {
      console.error('Error in custom query:', error);
      throw error;
    }
  }
}