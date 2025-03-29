import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import LoginForm from "@/components/auth/LoginForm";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user, loading } = useSupabaseAuth();
  const [directSessionCheck, setDirectSessionCheck] = useState<boolean | null>(null);
  
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
      } catch (e) {
        console.error("Error in direct session check:", e);
        setDirectSessionCheck(false);
      }
    };
    
    if (!loading && !isAuthenticated) {
      checkSessionDirectly();
    }
  }, [isAuthenticated, loading]);
  
  // Only redirect to dashboard if already authenticated
  useEffect(() => {
    // Only run this effect if we're sure about the auth state and user data is available
    if (!loading && isAuthenticated && user) {
      console.log("Already authenticated in context, redirecting from login page");
      
      // First try to get username from user data in a safe way
      let username = null;
      
      // Check user metadata
      if (user.user_metadata?.username) {
        username = user.user_metadata.username;
      } 
      // Fall back to email prefix
      else if (user.email) {
        username = user.email.split('@')[0];
      }
      
      // Only redirect to a username-prefixed route if we're certain we have a valid username
      if (username && username.length > 1 && !username.includes('/')) {
        console.log(`Redirecting to /${username}/dashboard`);
        navigate(`/${username}/dashboard`, { replace: true });
      } else {
        // If username can't be determined, use the generic route
        console.log("Username not available, redirecting to /dashboard");
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, loading, user, navigate]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
    </div>
  );
}
