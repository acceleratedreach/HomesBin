import { Express, Request, Response } from 'express';
import { SupabaseService } from '../supabase-client';

// Define custom session type with user property
declare module 'express-session' {
  interface Session {
    user?: {
      id: number;
      username: string;
      email: string;
      emailVerified?: boolean;
      fullName?: string;
    };
  }
}

export function registerSupabaseRoutes(app: Express) {
  // This endpoint specifically for profiles doesn't require authentication
  // to let users look up emails by username for login
  app.get('/api/supabase/profiles', async (req: Request, res: Response) => {
    try {
      const { username, email, ...otherFilters } = req.query;
      
      // Build filters object based on provided query parameters
      const filters: Record<string, any> = {};
      
      // Only specific fields can be used for lookup
      if (username) {
        filters.username = username;
      }
      
      if (email) {
        filters.email = email;
      }
      
      // Specify fields that can be returned for security
      const selectFields = 'id, username, email, full_name';
      
      const data = await SupabaseService.getAll('profiles', {
        select: selectFields,
        filters
      });
      
      res.status(200).json(data);
    } catch (error: any) {
      console.error('Error looking up profiles in Supabase:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: error.message 
      });
    }
  });
  
  /**
   * Generic endpoint to fetch data from a Supabase table
   */
  app.get('/api/supabase/:tableName', async (req: Request, res: Response) => {
    try {
      // Skip auth check for public tables
      const publicTables = ['profiles', 'public_listings'];
      const { tableName } = req.params;
      
      if (!publicTables.includes(tableName) && !(req.session as any).user && !(req as any).user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const {
        select,
        orderBy,
        orderDirection,
        limit,
        ...filters
      } = req.query;

      // Convert limit to number if it exists
      const limitNum = limit ? parseInt(limit as string) : undefined;

      const data = await SupabaseService.getAll(tableName, {
        select: select as string || '*',
        orderBy: orderBy as string,
        orderDirection: (orderDirection as 'asc' | 'desc'),
        limit: limitNum,
        filters: filters as Record<string, any>
      });

      res.status(200).json(data);
    } catch (error: any) {
      console.error('Error fetching from Supabase:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: error.message 
      });
    }
  });

  /**
   * Get a single record by ID
   */
  app.get('/api/supabase/:tableName/:id', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated from either Express session or Supabase auth
      if (!(req.session as any).user && !(req as any).user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { tableName, id } = req.params;
      const { select } = req.query;

      const data = await SupabaseService.getById(
        tableName,
        id,
        select as string
      );

      res.status(200).json(data);
    } catch (error: any) {
      console.error(`Error fetching from Supabase ${req.params.tableName}:`, error);
      res.status(500).json({ 
        message: 'Server error',
        error: error.message 
      });
    }
  });

  /**
   * Create a new record
   */
  app.post('/api/supabase/:tableName', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated from either Express session or Supabase auth
      if (!(req.session as any).user && !(req as any).user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { tableName } = req.params;
      const data = req.body;

      // Add user_id to the data if not present
      const userId = (req.session as any).user?.id || (req as any).user?.id;
      if (!data.user_id && userId) {
        data.user_id = userId;
      }

      const result = await SupabaseService.insert(tableName, data);
      res.status(201).json(result);
    } catch (error: any) {
      console.error(`Error creating in Supabase ${req.params.tableName}:`, error);
      res.status(500).json({ 
        message: 'Server error',
        error: error.message 
      });
    }
  });

  /**
   * Update a record
   */
  app.put('/api/supabase/:tableName/:id', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated from either Express session or Supabase auth
      if (!(req.session as any).user && !(req as any).user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { tableName, id } = req.params;
      const data = req.body;

      // Ensure user can only update their own records
      const userId = (req.session as any).user?.id || (req as any).user?.id;
      const record = await SupabaseService.getById(tableName, id);
      if (record && 'user_id' in record && record.user_id !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const result = await SupabaseService.update(tableName, id, data);
      res.status(200).json(result);
    } catch (error: any) {
      console.error(`Error updating in Supabase ${req.params.tableName}:`, error);
      res.status(500).json({ 
        message: 'Server error',
        error: error.message 
      });
    }
  });

  /**
   * Delete a record
   */
  app.delete('/api/supabase/:tableName/:id', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated from either Express session or Supabase auth
      if (!(req.session as any).user && !(req as any).user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { tableName, id } = req.params;

      // Ensure user can only delete their own records
      const userId = (req.session as any).user?.id || (req as any).user?.id;
      const record = await SupabaseService.getById(tableName, id);
      if (record && 'user_id' in record && record.user_id !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      await SupabaseService.delete(tableName, id);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error(`Error deleting from Supabase ${req.params.tableName}:`, error);
      res.status(500).json({ 
        message: 'Server error',
        error: error.message 
      });
    }
  });

  /**
   * Count records in a table
   */
  app.get('/api/supabase/:tableName/count', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated from either Express session or Supabase auth
      if (!(req.session as any).user && !(req as any).user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { tableName } = req.params;
      const filters = req.query;

      const count = await SupabaseService.count(tableName, filters as Record<string, any>);
      res.status(200).json({ count });
    } catch (error: any) {
      console.error(`Error counting in Supabase ${req.params.tableName}:`, error);
      res.status(500).json({ 
        message: 'Server error',
        error: error.message 
      });
    }
  });

  /**
   * Create or update user profile
   */
  app.post('/api/supabase/profiles', async (req: Request, res: Response) => {
    try {
      // We'll allow profile creation even without session for initial setup
      const profileData = req.body;
      
      if (!profileData.id) {
        return res.status(400).json({ 
          message: 'Profile ID is required',
          error: 'Missing profile ID'
        });
      }
      
      console.log('Creating/updating profile:', profileData.id);
      
      // Ensure timestamps are set
      if (!profileData.created_at) {
        profileData.created_at = new Date().toISOString();
      }
      profileData.updated_at = new Date().toISOString();
      
      // Insert or update the profile
      const result = await SupabaseService.upsert('profiles', profileData);
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error creating/updating profile in Supabase:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: error.message 
      });
    }
  });
}