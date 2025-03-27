import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Define the context types
type SupabaseAuthContextType = {
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  loading: boolean;
  isAuthenticated: boolean;
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
});

// Provider component
export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Initial session check
  useEffect(() => {
    try {
      // Check for an existing session
      const getSession = async () => {
        try {
          // Check if supabase.auth is available before calling methods
          if (supabase?.auth) {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
              console.error('Error getting session:', error);
            } else {
              setSession(data.session);
              setUser(data.session?.user || null);
            }
          } else {
            console.error('Supabase auth is not available');
          }
        } catch (error) {
          console.error('Error in session check:', error);
        } finally {
          setLoading(false);
        }
      };

      getSession();

      // Setup auth state change listener if supabase.auth is available
      let authListener: { subscription?: { unsubscribe: () => void } } = {};
      
      if (supabase?.auth?.onAuthStateChange) {
        try {
          const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
            console.log('Auth state changed:', event);
            setSession(newSession);
            setUser(newSession?.user || null);
            setLoading(false);
          });
          
          authListener = data;
        } catch (error) {
          console.error('Error setting up auth listener:', error);
        }
      }

      // Cleanup function
      return () => {
        if (authListener?.subscription?.unsubscribe) {
          authListener.subscription.unsubscribe();
        }
      };
    } catch (error) {
      console.error('Error in auth effect:', error);
      setLoading(false);
    }
  }, []);

  // Sign up function
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setLoading(true);
      
      if (!supabase?.auth?.signUp) {
        throw new Error('Supabase auth is not properly configured');
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        toast({
          title: 'Sign up failed',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: 'Sign up successful',
        description: 'Please check your email for a confirmation link',
      });
      return { error: null };
    } catch (error: any) {
      console.error('Error signing up:', error);
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
      
      if (!supabase?.auth?.signInWithPassword) {
        throw new Error('Supabase auth is not properly configured');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: 'Welcome back',
        description: 'Successfully signed in',
      });
      return { error: null };
    } catch (error: any) {
      console.error('Error signing in:', error);
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
      
      if (!supabase?.auth?.signOut) {
        throw new Error('Supabase auth is not properly configured');
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        toast({
          title: 'Sign out failed',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully',
      });
      return { error: null };
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: 'An error occurred',
        description: error.message || 'Unknown error occurred during sign out',
        variant: 'destructive',
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    signUp,
    signIn,
    signOut,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

// Hook for easy context consumption
export const useSupabaseAuth = () => {
  return useContext(SupabaseAuthContext);
};