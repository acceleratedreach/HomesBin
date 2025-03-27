import { Express, Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase-client';

export function registerAuthRoutes(app: Express) {
  /**
   * Get the current session information
   */
  app.get('/api/auth/session', async (req: Request, res: Response) => {
    try {
      // Check for authorization header
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Get token from header
        const token = authHeader.substring(7);
        
        // Use token to set auth context for Supabase
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          console.error('Session error:', sessionError);
          return res.status(401).json({ message: 'Not authenticated' });
        }
        
        // Get the user from the session
        const user = sessionData.session.user;
        
        if (!user) {
          return res.status(401).json({ message: 'No user in session' });
        }
        
        // Return user data
        return res.status(200).json({
          user: {
            id: user.id,
            email: user.email,
            username: user.user_metadata?.username || user.email?.split('@')[0],
            emailVerified: !!user.email_confirmed_at,
            fullName: user.user_metadata?.full_name || '',
          }
        });
      }
      
      // No valid token found
      return res.status(401).json({ message: 'Not authenticated' });
    } catch (error: any) {
      console.error('Error checking session:', error);
      res.status(500).json({
        message: 'Server error',
        error: error.message
      });
    }
  });

  /**
   * Get data about the current user
   */
  app.get('/api/auth/user', async (req: Request, res: Response) => {
    try {
      // Check current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Get the user from the session
      const user = sessionData.session.user;
      
      if (!user) {
        return res.status(401).json({ message: 'No user in session' });
      }
      
      // Get additional profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Return combined user data
      return res.status(200).json({
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || profileData?.username || user.email?.split('@')[0],
        emailVerified: !!user.email_confirmed_at,
        fullName: profileData?.full_name || user.user_metadata?.full_name || '',
        bio: profileData?.bio || '',
        title: profileData?.title || '',
        phone: profileData?.phone || '',
        avatar: profileData?.avatar_url || '',
        location: profileData?.location || '',
        experience: profileData?.experience || '',
        specialties: profileData?.specialties || [],
        licenses: profileData?.licenses || [],
      });
    } catch (error: any) {
      console.error('Error getting user data:', error);
      res.status(500).json({
        message: 'Server error',
        error: error.message
      });
    }
  });

  /**
   * Supabase auth check middleware for express routes
   */
  app.use('/api/auth/check', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check the current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Get the user from the session
      const user = sessionData.session.user;
      
      if (!user) {
        return res.status(401).json({ message: 'No user in session' });
      }
      
      // Send successful response
      return res.status(200).json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email
        }
      });
    } catch (error: any) {
      console.error('Auth check error:', error);
      res.status(500).json({
        message: 'Server error',
        error: error.message
      });
    }
  });
}

// Middleware to check if user is authenticated with Supabase
export const supabaseAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Get the user from the session
    const user = sessionData.session.user;
    
    if (!user) {
      return res.status(401).json({ message: 'No user in session' });
    }
    
    // Attach user data to request
    (req as any).user = user;
    return next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};