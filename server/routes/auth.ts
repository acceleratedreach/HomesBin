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
      referer: req?.headers.referer || 'not set',
      method: req?.method || 'unknown'
    });
    
    // Enhanced token processing
    let accessToken = null;
    let tokenSource = 'none';
    
    // Priority 1: Check for explicit Authorization header (most reliable)
    if (req?.headers.authorization) {
      const authHeader = req.headers.authorization;
      
      // Handle both Bearer token and JWT directly
      if (authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.replace('Bearer ', '');
        tokenSource = 'bearer-header';
      } else if (authHeader.includes('.')) {
        // Looks like a raw JWT token (has at least one dot separator)
        accessToken = authHeader;
        tokenSource = 'raw-jwt-header';
      }
      
      if (accessToken) {
        console.log(`🔍 Auth debug - Using token from Authorization header (${tokenSource})`);
      }
    }
    
    // Priority 2: Custom header for direct token passing (backup method)
    if (!accessToken && req?.headers['x-supabase-token']) {
      accessToken = req.headers['x-supabase-token'] as string;
      tokenSource = 'x-header';
      console.log('🔍 Auth debug - Using token from X-Supabase-Token header');
    }
    
    // Priority 3: Check cookies for auth tokens (session based)
    if (!accessToken && req?.headers.cookie) {
      const cookies = req.headers.cookie.split(';').map(c => c.trim());
      
      // Look for Supabase access token in cookies (various formats)
      for (const cookie of cookies) {
        // Handle different possible cookie names based on how Supabase might store them
        if (cookie.startsWith('sb-access-token=') || 
            cookie.startsWith('sb:token=') || 
            cookie.startsWith('supabase-auth-token=') ||
            cookie.startsWith('sb-auth-token=') ||
            cookie.startsWith('sb-') && cookie.includes('-auth-token=')) {
          
          // Extract actual token value
          const cookieParts = cookie.split('=');
          if (cookieParts.length > 1) {
            accessToken = decodeURIComponent(cookieParts[1]);
            tokenSource = 'cookie-' + cookieParts[0];
            console.log(`🔍 Auth debug - Found token in cookies: ${cookieParts[0]}`);
            break;
          }
        }
      }
    }
    
    // If we have a token from any source, try to use it
    if (accessToken) {
      try {
        console.log(`🔍 Auth debug - Authenticating with token from ${tokenSource} source`);
        
        // Check token format validity - simple check for JWT structure
        const isValidFormat = accessToken.includes('.') && accessToken.split('.').length === 3;
        if (!isValidFormat) {
          console.log('🔍 Auth debug - Token does not appear to be a valid JWT format');
          // But still try anyway in case it's another valid format
        }
        
        // Try both methods for getting user from token for maximum compatibility
        // Method 1: Use the supplied token to authenticate directly
        let userData = null;
        let userError = null;
        
        try {
          const userResponse = await supabase.auth.getUser(accessToken);
          userData = userResponse.data;
          userError = userResponse.error;
        } catch (innerError) {
          console.warn('Inner error getting user with token:', innerError);
          // Continue to next approach
        }
        
        // Method 2: Try to set session first, then get user (sometimes more reliable)
        if (userError || !userData?.user) {
          console.log('🔍 Auth debug - First token attempt failed, trying setSession approach');
          
          try {
            // Check which method is available in this Supabase version
            let authResult;
            
            if (typeof supabase.auth.setSession === 'function') {
              console.log('🔍 Auth debug - Using setSession to recover session');
              authResult = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: accessToken // Try using the access token as refresh token as fallback
              });
            } else if (typeof supabase.auth.refreshSession === 'function') {
              console.log('🔍 Auth debug - Using refreshSession to recover session');
              authResult = await supabase.auth.refreshSession({
                refresh_token: accessToken // Try using the access token as refresh token as fallback
              });
            } else {
              console.warn('🔍 Auth debug - Neither setSession nor refreshSession available');
              authResult = { error: new Error('Session refresh methods not available') };
            }
            
            if (authResult.error) {
              console.warn('Could not refresh session with token, trying getUser directly');
              // If refresh fails, try to get user directly with token
              const directUserResponse = await supabase.auth.getUser(accessToken);
              userData = directUserResponse.data;
              userError = directUserResponse.error;
            } else {
              // If refresh succeeds, get user from the session
              userData = { user: authResult.data.session?.user };
              userError = null;
            }
          } catch (sessionRefreshError) {
            console.warn('Error refreshing session with token:', sessionRefreshError);
            
            // Last attempt - try getUser directly with the token
            try {
              const fallbackUserResponse = await supabase.auth.getUser(accessToken);
              userData = fallbackUserResponse.data;
              userError = fallbackUserResponse.error;
            } catch (fallbackError) {
              console.error('Final fallback getUser attempt failed:', fallbackError);
            }
          }
        }
        
        // Process results of token validation attempts
        if (userError) {
          console.log('🔍 Auth debug - Token error:', userError.message);
        } else if (userData.user) {
          console.log(`🔍 Auth success - Valid token from ${tokenSource}`);
          
          // Create a proper session object using the token
          return { 
            session: { 
              user: userData.user, 
              access_token: accessToken,
              // Estimate expiration if not available
              expires_at: userData.user.exp || Date.now() + (3600 * 1000), // 1 hour from now as fallback
              token_type: 'bearer',
              refresh_token: null
            }, 
            user: userData.user 
          };
        }
      } catch (tokenError) {
        console.error('Error processing auth token:', tokenError);
      }
    }
    
    // Final fallback: Try standard session API call
    console.log('🔍 Auth debug - Falling back to getSession() API call');
    try {
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
    } catch (sessionError) {
      console.error('Error in getSession API call:', sessionError);
      return { session: null, user: null };
    }
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
      // Check authentication using our enhanced safeGetSession method
      const { session, user } = await safeGetSession(req);
      
      if (!session || !user) {
        console.log('🔍 Auth debug - No valid session found in /api/auth/user');
        return res.status(401).json({ 
          message: 'Not authenticated',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log('🔍 Auth success - User authenticated in /api/auth/user:', user.id);
      
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

// Enhanced middleware for Supabase authentication with comprehensive CORS and token handling
export const supabaseAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Set robust CORS headers for all auth-related requests to handle cross-domain auth properly
    const origin = req.headers.origin;
    const host = req.headers.host || '';
    
    // Determine if we're in specific environments for CORS behavior
    const isReplit = host.includes('.repl.');
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Apply appropriate CORS headers based on environment
    if (origin) {
      // Allow the specific origin for proper CORS compliance
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 
        'Content-Type, Authorization, X-Requested-With, X-Supabase-Token, X-Client-Info');
      res.setHeader('Access-Control-Expose-Headers', 
        'Content-Length, X-RateLimit-Limit, X-RateLimit-Remaining');
      
      // Cache preflight for 24 hours to improve performance
      res.setHeader('Access-Control-Max-Age', '86400');
      
      // Log allowed origin for debugging
      console.log(`🔍 Auth middleware - CORS for origin: ${origin.substring(0, 30)}...`);
      
      // Handle preflight OPTIONS requests efficiently
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
    }
    
    // Check if request has the X-Skip-Auth header or query param for public routes
    const skipAuth = req.headers['x-skip-auth'] === 'true' || req.query.skipAuth === 'true';
    if (skipAuth) {
      console.log('🔍 Auth middleware - Skipping auth check (public route)');
      return next();
    }
    
    // Use safeGetSession to handle all auth methods including tokens and cookies
    const { user, session } = await safeGetSession(req);
    
    if (!user) {
      console.log('🔍 Auth middleware - Authentication failed');
      return res.status(401).json({ 
        message: 'Not authenticated',
        timestamp: new Date().toISOString()
      });
    }
    
    // Log successful authentication with important context
    console.log(`🔍 Auth middleware - User authenticated: ${user.id}, method: ${req.headers.authorization ? 'token' : 'session'}`);
    
    // Enhance user object with additional information for route handlers
    const enhancedUser = {
      ...user,
      // Standard fields with safe fallbacks
      id: user.id,
      email: user.email || '',
      username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
      
      // Auth metadata
      isAuthenticated: true,
      authMethod: req.headers.authorization ? 'token' : 'session',
      authTimestamp: Date.now(),
      tokenExpires: session?.expires_at || null,
      
      // User profile data with safe access
      emailVerified: !!user.email_confirmed_at,
      fullName: user.user_metadata?.full_name || '',
      role: user.role || 'authenticated',
      
      // Context data
      requestInfo: {
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        origin: origin || 'unknown',
        path: req.path
      }
    };
    
    // Attach enhanced user data to request for route handlers
    (req as any).user = enhancedUser;
    // Store the Supabase session in a supabaseSession property instead of overriding the Express session
    (req as any).supabaseSession = session;
    
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