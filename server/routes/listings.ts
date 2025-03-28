import { Express, Request, Response } from 'express';
import { supabaseAuth } from './auth';
import { supabase } from '../supabase-client';

export function registerListingsRoutes(app: Express) {
  // Get listings for the current user
  app.get('/api/listings', async (req: Request, res: Response) => {
    try {
      // First check if user is authenticated through Supabase
      let user;
      
      // Try to get user from Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data.user) {
          user = data.user;
        }
      }
      
      // If no user from token, check if user is set via middleware
      if (!user && (req as any).user) {
        user = (req as any).user;
      }
      
      // If still no user, check session
      if (!user) {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session) {
          user = data.session.user;
        }
      }
      
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Get listings from Supabase
      const { data: listings, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching listings:', error);
        return res.status(500).json({ message: 'Error fetching listings' });
      }
      
      return res.json(listings || []);
    } catch (error: any) {
      console.error('Error fetching listings:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Other listing routes can be added here
} 