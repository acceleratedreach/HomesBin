import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, getSupabaseClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Define types for the Supabase auth listener return value
interface Subscription {
  id: string;
  callback: (event: AuthChangeEvent, session: Session | null) => void;
  unsubscribe: () => void;
}

interface AuthListener {
  data: {
    subscription: Subscription;
  };
}

// Define the context types
type SupabaseAuthContextType = {
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any, data?: { session: Session, user: User } }>;
  signOut: () => Promise<{ error: any }>;
  loading: boolean;
  isAuthenticated: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
};

// Create the context with default values
const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  session: null,
  user: null,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  loading: true,
  isAuthenticated: false,
  setSession: () => {},
  setUser: () => {},
});

// Provider component
export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Initial session check and auth state change listener setup with improved reliability
  useEffect(() => {
    let authListener: AuthListener | null = null;
    let sessionCheckInterval: NodeJS.Timeout | null = null;
    let isMounted = true; // Track component mount state

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth context and checking for existing session...');
        
        // Step 1: Check for stored tokens as backup
        let backupTokens = null;
        try {
          const accessToken = localStorage.getItem('sb-access-token');
          const refreshToken = localStorage.getItem('sb-refresh-token');
          
          if (accessToken && refreshToken) {
            console.log('Found backup tokens in localStorage, will use if needed');
            backupTokens = { access_token: accessToken, refresh_token: refreshToken };
          }
        } catch (storageError) {
          console.warn('Error checking for backup tokens:', storageError);
        }
        
        // Step 2: Ensure we have a properly initialized Supabase client
        const supabaseClient = await getSupabaseClient();
        
        // Step 3: Primary session check through Supabase API
        let sessionResult;
        try {
          console.log('Getting current session from Supabase...');
          sessionResult = await supabaseClient.auth.getSession();
        } catch (sessionError) {
          console.error('Error in primary session check:', sessionError);
          // If the primary check fails, we'll proceed to fallback methods
        }
        
        // Step 4: Handle error or missing session with fallback
        if (sessionResult?.error || !sessionResult?.data?.session) {
          console.log('Primary session check failed or returned no session');
          
          if (sessionResult?.error) {
            console.error('Session check error:', sessionResult.error);
          }
          
          // Try to recover using backup tokens if available
          if (backupTokens) {
            try {
              console.log('Attempting session recovery with backup tokens...');
              // Use the refreshSession method which is more reliable than setSession
              const { data: authData, error: refreshError } = await supabaseClient.auth.refreshSession({
                refresh_token: backupTokens.refresh_token
              });
              
              if (refreshError) {
                console.error('Failed to recover session with backup tokens:', refreshError);
              } else if (authData?.session) {
                console.log('Successfully recovered session from backup tokens');
                sessionResult = { data: authData, error: null };
              }
            } catch (recoveryError) {
              console.error('Error during session recovery attempt:', recoveryError);
            }
          }
        }
        
        // Step 5: Set session state based on available data
        if (sessionResult?.data?.session && isMounted) {
          console.log('Session found, setting auth context state');
          setSession(sessionResult.data.session);
          setUser(sessionResult.data.session.user);
          
          // Ensure tokens are stored for resilience
          try {
            localStorage.setItem('sb-access-token', sessionResult.data.session.access_token);
            localStorage.setItem('sb-refresh-token', sessionResult.data.session.refresh_token);
            localStorage.setItem('sb-user-id', sessionResult.data.session.user.id);
            localStorage.setItem('sb-session-active', 'true');
            localStorage.setItem('sb-auth-timestamp', Date.now().toString());
          } catch (storageError) {
            console.warn('Failed to store session tokens for resilience:', storageError);
          }
        } else if (isMounted) {
          console.log('No valid session found after all attempts');
        }
        
        // Step 6: Set up auth state change listener with improved error handling
        try {
          const listenerResult = supabaseClient.auth.onAuthStateChange((event, newSession) => {
            console.log('Auth state changed:', event);
            console.log('Session exists:', !!newSession);
            
            if (!isMounted) return;
            
            // Update state
            setSession(newSession);
            setUser(newSession?.user || null);
            
            // Event-specific handling
            if (event === 'SIGNED_IN' && newSession) {
              console.log('User signed in, session established');
              
              // Store tokens for resilience
              try {
                localStorage.setItem('sb-access-token', newSession.access_token);
                localStorage.setItem('sb-refresh-token', newSession.refresh_token);
                localStorage.setItem('sb-user-id', newSession.user.id);
                localStorage.setItem('sb-session-active', 'true');
                localStorage.setItem('sb-auth-timestamp', Date.now().toString());
              } catch (e) {
                console.warn('Could not store tokens on sign in:', e);
              }
            } else if (event === 'SIGNED_OUT') {
              console.log('User signed out, session cleared');
              // Clear backup tokens
              try {
                localStorage.removeItem('sb-access-token');
                localStorage.removeItem('sb-refresh-token');
                localStorage.removeItem('sb-user-id');
                localStorage.removeItem('sb-session-active');
              } catch (e) {
                console.warn('Could not clear tokens on sign out:', e);
              }
            } else if (event === 'TOKEN_REFRESHED' && newSession) {
              console.log('Session token refreshed, updating stored tokens');
              // Update backup tokens
              try {
                localStorage.setItem('sb-access-token', newSession.access_token);
                localStorage.setItem('sb-refresh-token', newSession.refresh_token);
                localStorage.setItem('sb-auth-timestamp', Date.now().toString());
              } catch (e) {
                console.warn('Could not update tokens on refresh:', e);
              }
            }
          });
          
          authListener = listenerResult.data;
        } catch (listenerError) {
          console.error('Failed to set up auth state change listener:', listenerError);
        }
        
        // Step 7: Set up improved session monitoring
        sessionCheckInterval = setInterval(async () => {
          try {
            if (!isMounted) return;
            
            // Skip if already signed out
            if (!session) return;
            
            // Only log session check when in development to reduce noise
            if (process.env.NODE_ENV !== 'production') {
              console.log('Periodic session check...');
            }
            
            const supabaseClient = await getSupabaseClient();
            const { data, error } = await supabaseClient.auth.getSession();
            
            if (error) {
              console.warn('Error during periodic session check:', error);
              return;
            }
            
            if (!data.session && session && isMounted) {
              console.warn('Session lost during periodic check, updating state');
              // Before clearing, try one last recovery attempt
              try {
                const backupRefresh = localStorage.getItem('sb-refresh-token');
                
                if (backupRefresh) {
                  console.log('Attempting recovery during session check...');
                  const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession({
                    refresh_token: backupRefresh
                  });
                  
                  if (!refreshError && refreshData.session && isMounted) {
                    console.log('Successfully recovered session during check');
                    setSession(refreshData.session);
                    setUser(refreshData.session.user);
                    return;
                  }
                }
              } catch (recoveryError) {
                console.error('Recovery failed during session check:', recoveryError);
              }
              
              // If recovery failed, clear the state
              if (isMounted) {
                setSession(null);
                setUser(null);
              }
            }
          } catch (e) {
            console.error('Error in periodic session check:', e);
          }
        }, 60000); // Check every minute (reduced frequency)
        
        // Step 8: Complete initialization
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Fatal error in auth initialization:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Start initialization
    initializeAuth();
    
    // Cleanup function
    return () => {
      isMounted = false;
      
      if (authListener && authListener.subscription) {
        console.log('Cleaning up auth listener');
        try {
          authListener.subscription.unsubscribe();
        } catch (unsubError) {
          console.warn('Error unsubscribing from auth listener:', unsubError);
        }
      }
      
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, []);

  // Sign up with email
  const signUp = async (email: string, password: string, metadata: any = {}) => {
    try {
      // Get a properly initialized client
      const supabaseClient = await getSupabaseClient();
      
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: window.location.origin + '/verify-email'
        }
      });
      
      if (!error && data) {
        toast({
          title: "Sign-up successful",
          description: "Please check your email to verify your account.",
        });
      } else if (error) {
        toast({
          title: "Sign-up failed",
          description: error.message,
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (error: any) {
      console.error('SignUp error:', error);
      toast({
        title: "Sign-up failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  // Sign in with email
  const signIn = async (email: string, password: string) => {
    try {
      // Get a properly initialized client
      const supabaseClient = await getSupabaseClient();
      
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        
        // Store auth data for resilience
        try {
          localStorage.setItem('sb-access-token', data.session.access_token);
          localStorage.setItem('sb-refresh-token', data.session.refresh_token);
          localStorage.setItem('sb-user-id', data.user.id);
          localStorage.setItem('sb-session-active', 'true');
          localStorage.setItem('sb-auth-timestamp', Date.now().toString());
        } catch (e) {
          console.warn('Failed to store auth data after sign in:', e);
        }
        
        return { error: null, data: { session: data.session, user: data.user } };
      }
      
      return { error: new Error('No session or user returned') };
    } catch (error: any) {
      console.error('SignIn error:', error);
      toast({
        title: "Login failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // Get a properly initialized client
      const supabaseClient = await getSupabaseClient();
      
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        toast({
          title: "Sign-out failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Clear state
        setSession(null);
        setUser(null);
        
        // Clear stored tokens
        try {
          localStorage.removeItem('sb-access-token');
          localStorage.removeItem('sb-refresh-token');
          localStorage.removeItem('sb-user-id');
          localStorage.removeItem('sb-session-active');
          localStorage.removeItem('sb-auth-timestamp');
        } catch (e) {
          console.warn('Failed to clear stored tokens on sign out:', e);
        }
        
        toast({
          title: "Sign-out successful",
          description: "You have been signed out.",
        });
      }
      
      return { error };
    } catch (error: any) {
      console.error('SignOut error:', error);
      toast({
        title: "Sign-out failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };
  
  // Context value with our auth state and functions
  const value = {
    session,
    user,
    signUp,
    signIn,
    signOut,
    loading,
    isAuthenticated: !!session && !!user,
    setSession,
    setUser,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

// Hook to use the context
export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};