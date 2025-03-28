import { Express, Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase-client';

// Debugging function to get user info without throwing errors
async function safeGetSession(req?: Request) {
  try {
    // Check for authorization header which might contain the Supabase token
    if (req && req.headers.authorization) {
      // Extract the token from the Bearer token
      const token = req.headers.authorization.replace('Bearer ', '');
      
      if (token) {
        console.log('Using token from Authorization header');
        try {
          // Use the token directly to get user
          const { data: userData, error: userError } = await supabase.auth.getUser(token);
          
          if (userError) {
            console.log('User error with token:', userError.message);
            // Fall back to getSession
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session) {
              return { session: null, user: null };
            }
            return { 
              session: sessionData.session,
              user: sessionData.session.user
            };
          }
          
          // Create a virtual session object using the token
          return { 
            session: { 
              user: userData.user, 
              access_token: token,
              refresh_token: null,
              expires_at: null,
              expires_in: 3600
            } as any, 
            user: userData.user 
          };
        } catch (tokenError) {
          console.error('Error using token:', tokenError);
        }
      }
    }
    
    // Check cookies for token
    if (req && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').map(c => c.trim());
      let token = null;
      
      // Look for Supabase access token in cookies
      for (const cookie of cookies) {
        if (cookie.startsWith('sb-access-token=')) {
          token = cookie.substring('sb-access-token='.length);
          console.log('Found token in cookies');
          break;
        }
      }
      
      if (token) {
        try {
          // Use the token directly to get user
          const { data: userData, error: userError } = await supabase.auth.getUser(token);
          
          if (userError) {
            console.log('User error with cookie token:', userError.message);
          } else {
            return { 
              session: { 
                user: userData.user, 
                access_token: token,
                refresh_token: null,
                expires_at: null,
                expires_in: 3600
              } as any, 
              user: userData.user 
            };
          }
        } catch (tokenError) {
          console.error('Error using cookie token:', tokenError);
        }
      }
    }
    
    // Default to normal session check
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('Session error:', error.message);
      return { session: null, user: null };
    }
    return { 
      session: data.session,
      user: data.session?.user || null
    };
  } catch (err) {
    console.error('Error in safeGetSession:', err);
    return { session: null, user: null };
  }
}

export function registerAuthRoutes(app: Express) {
  /**
   * Get the current session information
   */
  app.get('/api/auth/session', async (req: Request, res: Response) => {
    try {
      console.log('Session request headers:', req.headers);
      
      // Log session check attempt
      console.log('🔍 Session endpoint called');
      
      // Check for cookies and headers that Supabase might send
      const authHeader = req.headers.authorization;
      const cookieHeader = req.headers.cookie;
      
      console.log('🔍 Cookie header:', cookieHeader ? 'present' : 'absent');
      console.log('🔍 Auth header:', authHeader ? 'present' : 'absent');
      
      // Try to get the session safely, passing the request to check for the auth header
      const { session, user } = await safeGetSession(req);
      
      if (!session || !user) {
        console.log('🔍 No valid session found');
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      console.log('🔍 User authenticated:', user.id);
      console.log('🔍 Auth verification succeeded with method: Bearer token');
      
      // Try to fetch profile data, but don't fail if it doesn't exist
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.log('🔍 Profile error:', profileError.message);
          
          // If profile doesn't exist, return basic user data
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
        
        console.log('🔍 Profile data found for user');
        
        // Return user data with profile info
        return res.status(200).json({
          user: {
            id: user.id,
            email: user.email,
            username: profileData?.username || user.user_metadata?.username || user.email?.split('@')[0],
            emailVerified: !!user.email_confirmed_at,
            fullName: profileData?.full_name || user.user_metadata?.full_name || '',
          }
        });
      } catch (error) {
        console.log('🔍 Error accessing profile data, returning basic user info');
        
        // Return basic user data if profile fetch fails
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
      // Use the token from the Authorization header if available
      const authHeader = req.headers.authorization;
      let user = null;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Get the user from the token
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data.user) {
          user = data.user;
        }
      } 
      
      // If no user from token, fall back to session
      if (!user) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (!sessionError && sessionData.session) {
          user = sessionData.session.user;
        }
      }
      
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
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
    // First try to get user from the Authorization header
    const authHeader = req.headers.authorization;
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Get the user from the token
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        user = data.user;
      }
    }
    
    // If no user from token, fall back to session
    if (!user) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (!sessionError && sessionData.session) {
        user = sessionData.session.user;
      }
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Attach user data to request
    (req as any).user = user;
    return next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};