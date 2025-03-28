import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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

  // Initial session check and auth state change listener setup
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth context and checking for existing session...');
        
        // Get the current session, if any
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial session:', error);
          setLoading(false);
          return;
        }
        
        // If we have a session, set it and the user
        if (data.session) {
          console.log('Found existing session on auth context initialization');
          setSession(data.session);
          setUser(data.session.user);
        } else {
          console.log('No session found on auth context initialization');
        }
        
        // Set up auth state change listener
        const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
          console.log('Auth state changed:', event);
          console.log('Session exists:', !!newSession);
          
          setSession(newSession);
          setUser(newSession?.user || null);
          
          // Specifically handle sign in events to ensure the session is properly established
          if (event === 'SIGNED_IN' && newSession) {
            console.log('User signed in, session established');
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out, session cleared');
          }
        });
        
        // Set up periodic session checks
        const sessionCheckInterval = setInterval(async () => {
          try {
            // Avoid pointless checks if already signed out
            if (!session) return;
            
            console.log('Periodic session check...');
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.warn('Error during periodic session check:', error);
              return;
            }
            
            if (!data.session && session) {
              console.warn('Session lost during periodic check, updating state');
              setSession(null);
              setUser(null);
            }
          } catch (e) {
            console.error('Error in periodic session check:', e);
          }
        }, 30000); // Check every 30 seconds
        
        // Set loading to false once initialization is complete
        setLoading(false);
        
        // Cleanup function to unsubscribe
        return () => {
          if (authListener?.subscription) {
            console.log('Cleaning up auth listener');
            authListener.subscription.unsubscribe();
          }
          clearInterval(sessionCheckInterval);
        };
      } catch (error) {
        console.error('Error in auth initialization:', error);
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

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
      
      // Try clearing session storage first to avoid stale session data
      try {
        console.log('Cleaning up potential stale auth data...');
        for (const key of Object.keys(localStorage)) {
          if (key.includes('sb-') || key.includes('supabase')) {
            console.log(`Removing localStorage item: ${key}`);
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.warn('Error clearing storage:', e);
      }
      
      // Clear any existing sessions first to avoid conflicts
      try {
        console.log('Performing pre-signin cleanup...');
        const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
        if (signOutError) {
          console.warn('Error during pre-signin cleanup:', signOutError);
        } else {
          console.log('Pre-signin cleanup completed successfully');
        }
      } catch (e) {
        console.warn('Exception during pre-signin cleanup:', e);
      }
      
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
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
        console.log('Session explicitly set via setSession API');
      } catch (sessionSetError) {
        console.error('Failed to explicitly set the session:', sessionSetError);
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
            
            // Try one more time to set it
            try {
              await supabase.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token
              });
              console.log('Second attempt at setting session completed');
            } catch (secondSetError) {
              console.error('Second attempt to set session failed:', secondSetError);
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
      
      // Approach 2: Clear session manually via API
      try {
        console.log('Approach 2: Explicit session clearing');
        // This explicitly clears the current session
        await supabase.auth.setSession({
          access_token: '',
          refresh_token: ''
        });
        console.log('Explicit session clearing completed');
      } catch (sessionClearError) {
        console.warn('Error during explicit session clearing:', sessionClearError);
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