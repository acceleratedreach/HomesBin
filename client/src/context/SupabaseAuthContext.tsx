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
      
      // Try clearing session storage first to avoid stale session data
      try {
        for (const key of Object.keys(localStorage)) {
          if (key.includes('sb-') || key.includes('supabase')) {
            console.log(`Cleaning up potential stale auth data: ${key}`);
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.warn('Error clearing storage:', e);
      }
      
      // Clear any existing sessions first to avoid conflicts
      try {
        const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
        if (signOutError) {
          console.warn('Error during pre-signin cleanup:', signOutError);
        }
      } catch (e) {
        console.warn('Exception during pre-signin cleanup:', e);
      }
      
      // Attempt to sign in with Supabase
      console.log('Calling supabase.auth.signInWithPassword...');
      const signInResult = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
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
        return { error: customError };
      }

      // Check if we actually got a session and user back
      if (!signInResult.data.session || !signInResult.data.user) {
        console.error('Supabase returned no session or user after successful login');
        const customError = { message: 'Login succeeded but no session was created' };
        return { error: customError };
      }
      
      // Success case - we have both session and user
      const { session, user } = signInResult.data;
      console.log('Sign in successful, session established for user:', user.id.substring(0, 8) + '...');
      
      // If we got here, authentication was successful
      setSession(session);
      setUser(user);
      
      // Double-check that session was actually set
      setTimeout(async () => {
        try {
          const checkResult = await supabase.auth.getSession();
          console.log('Session check after login:', { 
            hasSession: !!checkResult?.data?.session,
            inContext: !!session
          });
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
      } catch (storageError) {
        console.warn('Could not save to localStorage:', storageError);
      }
      
      toast({
        title: 'Welcome back',
        description: 'Successfully signed in',
      });
      
      return { error: null };
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

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      console.log('Signing out user');
      
      // Delete any route-related search params that might interfere with auth
      const url = new URL(window.location.href);
      if (url.searchParams.has('code') || url.searchParams.has('error')) {
        url.searchParams.delete('code');
        url.searchParams.delete('error');
        url.searchParams.delete('error_description');
        window.history.replaceState({}, document.title, url.toString());
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        return { error };
      }
      
      // Clear our context state
      setSession(null);
      setUser(null);
      
      // Also clear any local storage keys related to auth
      try {
        localStorage.removeItem('sb-user-id');
        localStorage.removeItem('sb-session-active');
      } catch (e) {
        console.warn('Error clearing local storage:', e);
      }
      
      console.log('User successfully signed out');
      
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out',
      });
      
      return { error: null };
    } catch (error: any) {
      console.error('Error in signOut function:', error);
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