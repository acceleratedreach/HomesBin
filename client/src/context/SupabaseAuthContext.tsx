import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Define types for the Supabase auth listener return value
interface Subscription {
  id: string;
  callback: (event: AuthChangeEvent, session: Session | null) => void;
  unsubscribe: () => void;
}

// Update the AuthListener type to match what supabase.auth.onAuthStateChange returns in v2.49.3
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
        
        // Step 2: Primary session check through Supabase API
        let sessionResult;
        try {
          console.log('Getting current session from Supabase...');
          sessionResult = await supabase.auth.getSession();
        } catch (sessionError) {
          console.error('Error in primary session check:', sessionError);
          // If the primary check fails, we'll proceed to fallback methods
        }
        
        // Step 3: Handle error or missing session with fallback
        if (sessionResult?.error || !sessionResult?.data?.session) {
          console.warn('Primary session check failed or returned no session');
          
          if (sessionResult?.error) {
            console.error('Session check error:', sessionResult.error);
          }
          
          // Try to recover using backup tokens if available
          if (backupTokens) {
            try {
              console.log('Attempting session recovery with backup tokens...');
              // Use refreshSession instead of setSession which isn't available in v2.49.3
              const recoveryResult = await supabase.auth.refreshSession({
                refresh_token: backupTokens.refresh_token
              });
              
              if (recoveryResult.error) {
                console.error('Failed to recover session with backup tokens:', recoveryResult.error);
              } else if (recoveryResult.data?.session) {
                console.log('Successfully recovered session from backup tokens');
                sessionResult = recoveryResult;
              }
            } catch (recoveryError) {
              console.error('Error during session recovery attempt:', recoveryError);
            }
          }
        }
        
        // Step 4: Set session state based on available data
        if (sessionResult?.data?.session) {
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
        } else {
          console.log('No valid session found after all attempts');
        }
        
        // Step 5: Set up auth state change listener with improved error handling
        let authListener: AuthListener | null = null;
        try {
          const listenerResult = supabase.auth.onAuthStateChange((event, newSession) => {
            console.log('Auth state changed:', event);
            console.log('Session exists:', !!newSession);
            
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
          
          // In v2.49.3, we need to get the subscription from the data property
          authListener = {
            subscription: listenerResult.data.subscription
          };
        } catch (listenerError) {
          console.error('Failed to set up auth state change listener:', listenerError);
        }
        
        // Step 6: Set up improved session monitoring
        const sessionCheckInterval = setInterval(async () => {
          try {
            // Skip if already signed out
            if (!session) return;
            
            // Only log session check when in development to reduce noise
            if (process.env.NODE_ENV !== 'production') {
              console.log('Periodic session check...');
            }
            
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.warn('Error during periodic session check:', error);
              return;
            }
            
            if (!data.session && session) {
              console.warn('Session lost during periodic check, updating state');
              // Before clearing, try one last recovery attempt
              try {
                const backupAccess = localStorage.getItem('sb-access-token');
                const backupRefresh = localStorage.getItem('sb-refresh-token');
                
                if (backupAccess && backupRefresh) {
                  console.log('Attempting recovery during session check...');
                  // Use refreshSession instead of setSession which isn't available in v2.49.3
                  const recoveryResult = await supabase.auth.refreshSession({
                    refresh_token: backupRefresh
                  });
                  
                  if (!recoveryResult.error && recoveryResult.data.session) {
                    console.log('Successfully recovered session during check');
                    setSession(recoveryResult.data.session);
                    setUser(recoveryResult.data.session.user);
                    return;
                  }
                }
              } catch (recoveryError) {
                console.error('Recovery failed during session check:', recoveryError);
              }
              
              // If recovery failed, clear the state
              setSession(null);
              setUser(null);
            }
          } catch (e) {
            console.error('Error in periodic session check:', e);
          }
        }, 60000); // Check every minute (reduced frequency)
        
        // Step 7: Complete initialization
        setLoading(false);
        
        // Step 8: Cleanup function
        return () => {
          if (authListener) {
            console.log('Cleaning up auth listener');
            try {
              // In v2.49.3, we need to unsubscribe via the subscription property
              authListener.subscription.unsubscribe();
            } catch (unsubError) {
              console.warn('Error unsubscribing from auth listener:', unsubError);
            }
          }
          clearInterval(sessionCheckInterval);
        };
      } catch (error) {
        console.error('Fatal error in auth initialization:', error);
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, [session]); // Add session as dependency to reinitialize if it changes unexpectedly

  // Sign up function
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setLoading(true);
      console.log('Starting sign up process for:', email);

      // Prepare username from email if not provided
      const username = metadata?.username || email.split('@')[0];
      const fullName = metadata?.fullName || '';
      
      // Sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
            ...metadata
          },
          // Setting session persistence to true explicitly
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) {
        console.error('Supabase signup error:', error);
        toast({
          title: 'Sign up failed',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }
      
      // Check if the user was created successfully
      if (!data.user) {
        console.error('No user returned from signup');
        return { error: { message: 'Failed to create user account' } };
      }
      
      console.log('User created successfully, ID:', data.user.id);
      
      // Create an associated profile record
      try {
        const profileData = {
          id: data.user.id,
          username,
          email,
          full_name: fullName,
          avatar_url: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Creating profile for user:', profileData.id);
        
        // Create profile directly 
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' });
        
        if (profileError) {
          console.warn('Error creating profile directly:', profileError);
        } else {
          console.log('Profile created successfully');
        }
      } catch (profileError) {
        console.warn('Error during profile creation attempt:', profileError);
      }

      toast({
        title: 'Sign up successful',
        description: 'Please check your email for a confirmation link',
      });
      
      return { error: null };
    } catch (error: any) {
      console.error('Error in signup process:', error);
      toast({
        title: 'An error occurred',
        description: error.message || 'Unknown error occurred during sign up',
        variant: 'destructive',
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log(`Signing in user with email: ${email.substring(0, 3)}***`);
      
      // Verify Supabase client is initialized properly
      try {
        const clientCheck = await supabase.auth.getSession();
        console.log('Pre-signin Supabase client check:', {
          isInitialized: !!clientCheck,
          hasData: !!clientCheck?.data,
          hasError: !!clientCheck?.error
        });
        
        if (clientCheck?.error) {
          console.warn('Supabase client pre-check error:', clientCheck.error.message);
        }
      } catch (checkError) {
        console.error('Failed to verify Supabase client before signin:', checkError);
      }
      
      // IMPORTANT: We're NOT going to clear existing session data before login
      // This was causing issues with token persistence. Instead, we'll let Supabase handle session management.
      console.log('Proceeding with signin without clearing existing session data');
      
      // Attempt to sign in with Supabase
      console.log('Calling supabase.auth.signInWithPassword...');
      let signInResult;
      try {
        signInResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        console.log('Sign in response received:', {
          hasData: !!signInResult?.data,
          hasError: !!signInResult?.error,
          dataKeys: signInResult?.data ? Object.keys(signInResult.data) : [],
          hasSession: !!signInResult?.data?.session,
          hasUser: !!signInResult?.data?.user
        });
      } catch (signInError) {
        console.error('Exception during supabase.auth.signInWithPassword:', signInError);
        toast({
          title: 'Sign in failed',
          description: 'An error occurred while communicating with the authentication service',
          variant: 'destructive',
        });
        return { error: signInError };
      }
      
      // Handle error case
      if (signInResult.error) {
        console.error('Supabase signIn error:', signInResult.error);
        toast({
          title: 'Sign in failed',
          description: signInResult.error.message,
          variant: 'destructive',
        });
        return { error: signInResult.error };
      }
      
      // Handle missing data case
      if (!signInResult.data) {
        console.error('Supabase returned no data object');
        const customError = { message: 'Login failed: No response data' };
        toast({
          title: 'Authentication error',
          description: 'Login failed: No response from authentication service',
          variant: 'destructive',
        });
        return { error: customError };
      }

      // Check if we actually got a session and user back
      if (!signInResult.data.session || !signInResult.data.user) {
        console.error('Supabase returned no session or user after successful login');
        const customError = { message: 'Login succeeded but no session was created' };
        toast({
          title: 'Authentication error',
          description: 'Login succeeded but session creation failed',
          variant: 'destructive',
        });
        return { error: customError };
      }
      
      // Success case - we have both session and user
      const { session, user } = signInResult.data;
      console.log('Sign in successful, session established for user:', user.id.substring(0, 8) + '...');
      console.log('Session details:', {
        accessToken: session.access_token ? `${session.access_token.substring(0, 10)}...` : 'missing',
        refreshToken: session.refresh_token ? `${session.refresh_token.substring(0, 5)}...` : 'missing',
        expiresAt: session.expires_at || 'missing'
      });
      
      // If we got here, authentication was successful
      setSession(session);
      setUser(user);
      
      // Ensure the auth event is triggered and session is persisted
      try {
        // Force the session to be persisted by the auth client
        // Use refreshSession instead of setSession which isn't available in v2.49.3
        await supabase.auth.refreshSession({
          refresh_token: session.refresh_token
        });
        console.log('Session explicitly refreshed via refreshSession API');
      } catch (sessionSetError) {
        console.error('Failed to explicitly refresh the session:', sessionSetError);
      }
      
      // Double-check that session was actually set
      setTimeout(async () => {
        try {
          const checkResult = await supabase.auth.getSession();
          console.log('Session check after login:', { 
            hasSession: !!checkResult?.data?.session,
            inContext: !!session
          });
          
          if (!checkResult?.data?.session) {
            console.warn('Session verification failed - session not persisted properly');
            
            // Try one more time to refresh it
            try {
              // Use refreshSession instead of setSession which isn't available in v2.49.3
              await supabase.auth.refreshSession({
                refresh_token: session.refresh_token
              });
              console.log('Second attempt at refreshing session completed');
            } catch (secondSetError) {
              console.error('Second attempt to refresh session failed:', secondSetError);
            }
          }
        } catch (e) {
          console.warn('Error in post-login session check:', e);
        }
      }, 100);
      
      // Save the session explicitly to localStorage as a backup
      try {
        localStorage.setItem('sb-user-id', user.id);
        localStorage.setItem('sb-session-active', 'true');
        localStorage.setItem('sb-provider', 'email');
        // Store a timestamp to detect stale sessions
        localStorage.setItem('sb-auth-timestamp', Date.now().toString());
        // Also try to store the tokens directly as a last resort
        localStorage.setItem('sb-access-token', session.access_token);
        localStorage.setItem('sb-refresh-token', session.refresh_token);
      } catch (storageError) {
        console.warn('Could not save to localStorage:', storageError);
      }
      
      toast({
        title: 'Welcome back',
        description: 'Successfully signed in',
      });
      
      return { error: null, data: { session, user } };
    } catch (error: any) {
      console.error('Exception in signIn function:', error);
      toast({
        title: 'An error occurred',
        description: error.message || 'Unknown error occurred during sign in',
        variant: 'destructive',
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Enhanced sign out function with comprehensive token cleanup
  const signOut = async () => {
    try {
      setLoading(true);
      console.log('Starting signout process...');
      
      // Delete any route-related search params that might interfere with auth flow
      try {
        const url = new URL(window.location.href);
        const paramsToRemove = ['code', 'error', 'error_description', 'provider', 'access_token', 'token', 'state'];
        let paramsChanged = false;
        
        for (const param of paramsToRemove) {
          if (url.searchParams.has(param)) {
            url.searchParams.delete(param);
            paramsChanged = true;
          }
        }
        
        if (paramsChanged) {
          console.log('Cleaning up auth-related URL parameters');
          window.history.replaceState({}, document.title, url.toString());
        }
      } catch (urlError) {
        console.warn('Error cleaning URL parameters:', urlError);
      }

      // Get current session data for debugging purposes
      let currentUserId = '';
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const hasActiveSession = !!sessionData?.session;
        currentUserId = sessionData?.session?.user?.id || '';
        
        console.log('Session state before signout:', {
          hasSession: hasActiveSession,
          userId: currentUserId ? `${currentUserId.substring(0, 8)}...` : 'none',
          tokenExpiration: sessionData?.session?.expires_at 
            ? new Date(sessionData.session.expires_at * 1000).toISOString()
            : 'unknown'
        });
        
        // If we don't have a session, we might have already logged out
        if (!hasActiveSession) {
          console.log('No active session found, user may already be logged out');
          // Still proceed with cleanup to be thorough
        }
      } catch (sessionCheckError) {
        console.warn('Error checking session before signout:', sessionCheckError);
      }
      
      // First, update React context state to immediately reflect the UI change
      setSession(null);
      setUser(null);

      // Multi-approach sign out process - we'll try several methods to ensure signout happens
      console.log('🔐 Executing primary signout process...');
      
      // Approach 1: Standard global signout
      try {
        console.log('Approach 1: Standard global signout');
        const { error: signOutError } = await supabase.auth.signOut({ 
          scope: 'global' // Sign out from all devices
        });
        
        if (signOutError) {
          console.warn('Standard signout returned error:', signOutError.message);
        } else {
          console.log('Standard signout completed successfully');
        }
      } catch (primarySignOutError) {
        console.error('Exception during primary signout:', primarySignOutError);
      }
      
      // Approach 2: Let's skip manual session clearing since setSession isn't available
      try {
        console.log('Approach 2: Skipping explicit session clearing (not supported in this version)');
        // We'll rely on signOut() and storage cleanup instead
      } catch (sessionClearError) {
        console.warn('Error during session handling:', sessionClearError);
      }
      
      // Approach 3: Clear all auth data from local storage
      console.log('Approach 3: Storage cleanup');
      try {
        // Step 1: Handle all standard Supabase keys with a defined pattern
        const supabaseKeyPatterns = [
          'sb-', 'supabase.auth', 'supabase.', 'sb:', 'supa', 'auth-token', 
        ];
        
        // Clear from localStorage
        const localStorageKeysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            for (const pattern of supabaseKeyPatterns) {
              if (key.includes(pattern)) {
                localStorageKeysToRemove.push(key);
                break;
              }
            }
          }
        }
        
        // Clear from sessionStorage  
        const sessionStorageKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            for (const pattern of supabaseKeyPatterns) {
              if (key.includes(pattern)) {
                sessionStorageKeysToRemove.push(key);
                break;
              }
            }
          }
        }
        
        // Now remove all identified keys
        console.log(`Removing ${localStorageKeysToRemove.length} localStorage items and ${sessionStorageKeysToRemove.length} sessionStorage items`);
        
        for (const key of localStorageKeysToRemove) {
          localStorage.removeItem(key);
        }
        
        for (const key of sessionStorageKeysToRemove) {
          sessionStorage.removeItem(key);
        }
        
        // Step 2: Remove our explicit backup keys
        const explicitKeys = [
          'sb-user-id', 'sb-session-active', 'sb-provider', 
          'sb-auth-timestamp', 'sb-access-token', 'sb-refresh-token',
          'supabase-auth-token', 'supabase.auth.token', 'supa::auth',
          '__supabase_auth_token', '__supabase_session'
        ];
        
        for (const key of explicitKeys) {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        }
        
        console.log('Storage cleanup completed');
      } catch (storageError) {
        console.warn('Error during storage cleanup:', storageError);
      }
      
      // Approach 4: Attempt to clear cookies - note this will be limited by browser security
      console.log('Approach 4: Attempting to clear related cookies');
      try {
        // We can attempt to clear some cookies by setting them to expire
        // This is limited by browser security, but worth trying
        document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'supabase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      } catch (cookieError) {
        console.warn('Error during cookie clearing attempt:', cookieError);
      }
      
      // Final verification after a short delay to allow all operations to complete
      setTimeout(async () => {
        try {
          // Check if we actually got logged out
          const { data: verifyData } = await supabase.auth.getSession();
          
          if (verifyData?.session) {
            console.warn('⚠️ Session still exists after signout process - attempting final logout');
            
            // One final attempt as a fallback
            try {
              await supabase.auth.signOut({ scope: 'global' });
              console.log('Final signout attempt completed');
              
              // Extreme measure - explicitly update auth store
              try {
                // @ts-ignore - accessing private implementation details as last resort
                if (supabase.auth.autoRefreshToken) {
                  // @ts-ignore
                  supabase.auth.autoRefreshToken = false;
                }
              } catch (e) {
                // Ignore errors in this extreme fallback
              }
            } catch (finalAttemptError) {
              console.error('Final signout attempt failed:', finalAttemptError);
            }
          } else {
            console.log('✅ Session successfully cleared by verification check');
          }
        } catch (verifyError) {
          console.warn('Error during final session verification:', verifyError);
        }
      }, 300);
      
      // Always provide successful UI feedback, even if some internal cleanup failed
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out',
      });
      
      console.log('Sign out process completed');
      
      // This triggers potential navigation in components that listen to auth state
      return { error: null };
    } catch (error: any) {
      console.error('Error in signOut function:', error);
      toast({
        title: 'Sign out issue',
        description: 'There was an issue with the sign out process, but you have been logged out of this session',
        variant: 'destructive',
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        session,
        user,
        signUp,
        signIn,
        signOut,
        loading,
        isAuthenticated: !!session,
        setSession,
        setUser,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  return useContext(SupabaseAuthContext);
};