import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import LoginForm from "@/components/auth/LoginForm";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, loading } = useSupabaseAuth();
  const [directSessionCheck, setDirectSessionCheck] = useState<boolean | null>(null);
  
  // Perform a direct session check with Supabase
  useEffect(() => {
    const checkSessionDirectly = async () => {
      try {
        console.log("Login page: Checking session directly with Supabase");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
          setDirectSessionCheck(false);
          return;
        }
        
        const hasSession = !!data.session;
        console.log("Direct session check result:", { 
          hasSession, 
          userId: data.session?.user?.id ? data.session.user.id.substring(0, 8) + '...' : null 
        });
        
        setDirectSessionCheck(hasSession);
        
        // If we have a session but the context hasn't caught up yet, trigger a redirect
        if (hasSession && !isAuthenticated && !loading) {
          console.log("Session found directly but not in context; redirecting to dashboard");
          window.location.href = "/dashboard";
        }
      } catch (e) {
        console.error("Error in direct session check:", e);
        setDirectSessionCheck(false);
      }
    };
    
    if (!loading && !isAuthenticated) {
      checkSessionDirectly();
    }
  }, [isAuthenticated, loading]);
  
  // Debug login page state
  useEffect(() => {
    console.log("Login page state:", { 
      isAuthenticated, 
      loading, 
      directSessionCheck, 
      hasUser: !!user,
      userEmail: user?.email,
    });
  }, [isAuthenticated, loading, directSessionCheck, user]);
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    // If we're authenticated according to the context
    if (!loading && isAuthenticated && user) {
      console.log("Already authenticated in context, redirecting from login page");
      
      // Get username from user metadata
      const username = user.user_metadata?.username || 
                       user.email?.split('@')[0] || 
                       'dashboard';
      
      // Redirect to user-specific dashboard
      window.location.href = `/${username}/dashboard`;
    }
    // Also redirect if we detected a session directly with Supabase
    else if (directSessionCheck === true) {
      console.log("Session detected directly, redirecting to dashboard");
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated, loading, user, directSessionCheck]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
    </div>
  );
}
