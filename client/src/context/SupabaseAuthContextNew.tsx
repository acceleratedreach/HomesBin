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

  // Get initial session and set up auth state listener
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setLoading(true);
        console.log('Getting initial session');
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
        } else if (data?.session) {
          console.log('Initial session found');
          setSession(data.session);
          setUser(data.session.user);
        }
      } catch (error) {
        console.error('Exception getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    // Call the function to get the initial session
    getInitialSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed:', event);
      console.log('Session exists:', !!newSession);
      
      // Update the session and user state
      setSession(newSession);
      setUser(newSession?.user || null);
    });

    // Clean up the auth listener when component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign up function
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setLoading(true);
      
      // Prepare metadata from email if not provided
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
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) {
        console.error('Signup error:', error);
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
      
      console.log('User created successfully');
      
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
        
        // Create profile directly 
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' });
        
        if (profileError) {
          console.warn('Error creating profile:', profileError);
        }
      } catch (profileError) {
        console.warn('Error during profile creation:', profileError);
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
      
      // Sign in with password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Signin error:', error);
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }
      
      if (!data.user || !data.session) {
        console.error('No user or session returned from signin');
        return { error: { message: 'Failed to sign in to your account' } };
      }
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in',
      });
      
      return { 
        error: null,
        data: { 
          session: data.session,
          user: data.user
        }
      };
    } catch (error: any) {
      console.error('Error in signin process:', error);
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
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Signout error:', error);
        toast({
          title: 'Sign out failed',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }
      
      toast({
        title: 'Signed out',
        description: 'You have successfully signed out',
      });
      
      return { error: null };
    } catch (error: any) {
      console.error('Error in signout process:', error);
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

  // Calculate whether the user is authenticated
  const isAuthenticated = !!session && !!user;

  // Provide the auth context to children
  return (
    <SupabaseAuthContext.Provider
      value={{
        session,
        user,
        signUp,
        signIn,
        signOut,
        loading,
        isAuthenticated,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};

// Hook to use the auth context
export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};