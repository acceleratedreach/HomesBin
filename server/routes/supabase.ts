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
  /**
   * Generic endpoint to fetch data from a Supabase table
   */
  app.get('/api/supabase/:tableName', async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { tableName } = req.params;
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
      // Check if user is authenticated
      if (!req.session.user) {
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
      // Check if user is authenticated
      if (!req.session.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { tableName } = req.params;
      const data = req.body;

      // Add user_id to the data if not present
      if (!data.user_id && req.session.user.id) {
        data.user_id = req.session.user.id;
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
      // Check if user is authenticated
      if (!req.session.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { tableName, id } = req.params;
      const data = req.body;

      // Ensure user can only update their own records
      const record = await SupabaseService.getById(tableName, id);
      if (record && 'user_id' in record && record.user_id !== req.session.user.id) {
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
      // Check if user is authenticated
      if (!req.session.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const { tableName, id } = req.params;

      // Ensure user can only delete their own records
      const record = await SupabaseService.getById(tableName, id);
      if (record && 'user_id' in record && record.user_id !== req.session.user.id) {
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
      // Check if user is authenticated
      if (!req.session.user) {
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
}