import { Express, Request, Response, NextFunction } from 'express';
import { supabase } from '../supabase-client';

// Enhanced session retrieval function with CORS and environment support
async function safeGetSession(req?: Request) {
  try {
    // Log available authentication information
    console.log('Auth debug - Headers:', {
      hasAuth: !!req?.headers.authorization,
      hasCookie: !!req?.headers.cookie,
      origin: req?.headers.origin || 'not set',
      referer: req?.headers.referer || 'not set'
    });
    
    // Check for authorization header which might contain the Supabase token
    if (req?.headers.authorization) {
      // Extract the token from the Bearer token
      const token = req.headers.authorization.replace('Bearer ', '');
      
      if (token) {
        console.log('Using Bearer token from Authorization header');
        try {
          // Use the token directly to get user
          const { data: userData, error: userError } = await supabase.auth.getUser(token);
          
          if (userError) {
            console.log('🔍 Auth debug - Token error:', userError.message);
          } else if (userData.user) {
            console.log('🔍 Auth success - Valid Bearer token');
            
            // Create a proper session object using the token
            return { 
              session: { 
                user: userData.user, 
                access_token: token,
                expires_at: Date.now() + (3600 * 1000) // 1 hour from now as fallback
              }, 
              user: userData.user 
            };
          }
        } catch (tokenError) {
          console.error('Error processing Bearer token:', tokenError);
        }
      }
    }
    
    // Check cookies for token if available
    if (req?.headers.cookie) {
      const cookies = req.headers.cookie.split(';').map(c => c.trim());
      let accessToken = null;
      
      // Look for Supabase access token in cookies (various formats)
      for (const cookie of cookies) {
        // Handle different possible cookie names
        if (cookie.startsWith('sb-access-token=') || 
            cookie.startsWith('sb:token=') || 
            cookie.startsWith('supabase-auth-token=')) {
          
          // Extract actual token value
          const cookieParts = cookie.split('=');
          if (cookieParts.length > 1) {
            accessToken = decodeURIComponent(cookieParts[1]);
            console.log('🔍 Auth debug - Found token in cookies');
            break;
          }
        }
      }
      
      if (accessToken) {
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
          
          if (userError) {
            console.log('🔍 Auth debug - Cookie token error:', userError.message);
          } else if (userData.user) {
            console.log('🔍 Auth success - Valid cookie token');
            
            return { 
              session: { 
                user: userData.user, 
                access_token: accessToken,
                expires_at: Date.now() + (3600 * 1000) // 1 hour from now as fallback
              }, 
              user: userData.user 
            };
          }
        } catch (cookieError) {
          console.error('Error processing cookie token:', cookieError);
        }
      }
    }
    
    // Default to normal session check as a last resort
    console.log('🔍 Auth debug - Falling back to getSession() API call');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('🔍 Auth debug - Session error:', error.message);
      return { session: null, user: null };
    }
    
    if (data?.session?.user) {
      console.log('🔍 Auth success - Session found via API');
    } else {
      console.log('🔍 Auth debug - No session found via API');
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
   * Get the current session information with CORS support
   */
  app.get('/api/auth/session', async (req: Request, res: Response) => {
    try {
      // Enable proper cross-domain authentication
      const origin = req.headers.origin;
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Log allowed origin for debugging
        console.log('🔍 Auth debug - Setting CORS headers for origin:', origin);
      }
      
      // Log authentication attempt
      console.log('🔍 Session endpoint called from:', req.headers.referer || 'unknown');
      
      // Check authentication status
      const { session, user } = await safeGetSession(req);
      
      if (!session || !user) {
        console.log('🔍 Auth debug - No valid session found');
        return res.status(401).json({ 
          message: 'Not authenticated',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log('🔍 Auth success - User authenticated:', user.id);
      
      // Try to fetch user profile data from Supabase
      try {
        // First check if the 'profiles' table exists
        const { data: tableCheck, error: tableError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
          
        if (tableError && tableError.code === 'PGRST204') {
          console.log('🔍 Auth debug - Profiles table does not exist');
          // Return basic user data since we can't access profiles
          return res.status(200).json({
            user: {
              id: user.id,
              email: user.email,
              username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
              emailVerified: !!user.email_confirmed_at,
              fullName: user.user_metadata?.full_name || '',
              createdAt: user.created_at
            },
            session: {
              expires_at: session.expires_at
            }
          });
        }
        
        // Get the user profile if the table exists
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.log('🔍 Auth debug - Profile not found:', profileError.message);
          
          // If profile doesn't exist yet, attempt to create it
          if (profileError.code === 'PGRST116') {
            try {
              // Create a basic profile for the user
              const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  username: user.user_metadata?.username || user.email?.split('@')[0] || `user_${Date.now()}`,
                  full_name: user.user_metadata?.full_name || '',
                  email: user.email
                })
                .select()
                .single();
                
              if (insertError) {
                console.log('🔍 Auth debug - Failed to create profile:', insertError.message);
              } else {
                console.log('🔍 Auth success - Created new profile for user');
                
                // Return the newly created profile data
                return res.status(200).json({
                  user: {
                    id: user.id,
                    email: user.email,
                    username: newProfile.username || user.user_metadata?.username || user.email?.split('@')[0],
                    emailVerified: !!user.email_confirmed_at,
                    fullName: newProfile.full_name || user.user_metadata?.full_name || '',
                    createdAt: user.created_at
                  },
                  session: {
                    expires_at: session.expires_at
                  }
                });
              }
            } catch (createError) {
              console.error('Error creating profile:', createError);
            }
          }
          
          // Return basic user data if profile access failed
          return res.status(200).json({
            user: {
              id: user.id,
              email: user.email,
              username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
              emailVerified: !!user.email_confirmed_at,
              fullName: user.user_metadata?.full_name || '',
              createdAt: user.created_at
            },
            session: {
              expires_at: session.expires_at
            }
          });
        }
        
        console.log('🔍 Auth success - Profile data retrieved');
        
        // Return user data with profile info
        return res.status(200).json({
          user: {
            id: user.id,
            email: user.email,
            username: profileData?.username || user.user_metadata?.username || user.email?.split('@')[0],
            emailVerified: !!user.email_confirmed_at,
            fullName: profileData?.full_name || user.user_metadata?.full_name || '',
            createdAt: user.created_at,
            profileId: profileData?.id
          },
          session: {
            expires_at: session.expires_at
          }
        });
      } catch (profileAccessError) {
        console.log('🔍 Auth debug - Error accessing profile data:', profileAccessError);
        
        // Return basic user data if anything fails
        return res.status(200).json({
          user: {
            id: user.id,
            email: user.email,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
            emailVerified: !!user.email_confirmed_at,
            fullName: user.user_metadata?.full_name || '',
            createdAt: user.created_at
          },
          session: {
            expires_at: session.expires_at
          }
        });
      }
    } catch (error: any) {
      console.error('Session endpoint error:', error);
      res.status(500).json({
        message: 'Server error',
        error: error.message,
        timestamp: new Date().toISOString()
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

// Enhanced middleware for Supabase authentication with CORS support
export const supabaseAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Handle CORS for cross-domain requests
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
    }
    
    // Use safeGetSession to handle all auth methods
    const { user } = await safeGetSession(req);
    
    if (!user) {
      console.log('🔍 Auth middleware - Authentication failed');
      return res.status(401).json({ 
        message: 'Not authenticated',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('🔍 Auth middleware - User authenticated:', user.id);
    
    // Enhance user object with additional information
    const enhancedUser = {
      ...user,
      // Add helpful properties
      isAuthenticated: true,
      authMethod: req.headers.authorization ? 'token' : 'session',
      // Add timestamps
      authTimestamp: Date.now(),
      // Safe access to common properties
      email: user.email || '',
      emailVerified: !!user.email_confirmed_at,
      username: user.user_metadata?.username || user.email?.split('@')[0] || 'user'
    };
    
    // Attach enhanced user data to request for route handlers
    (req as any).user = enhancedUser;
    
    // Continue to the requested route
    return next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      message: 'Server authentication error',
      timestamp: new Date().toISOString()
    });
  }
};