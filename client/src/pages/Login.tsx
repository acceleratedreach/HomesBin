import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import LoginForm from "@/components/auth/LoginForm";
import { queryClient } from "@/lib/queryClient";

interface SessionData {
  user: {
    username: string;
    email: string;
    emailVerified: boolean;
    fullName?: string;
  };
}

export default function Login() {
  const [location, setLocation] = useLocation();
  const [wasLoggedOut, setWasLoggedOut] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  
  // Check if we just logged out
  useEffect(() => {
    const justLoggedOut = sessionStorage.getItem('just_logged_out') === 'true';
    if (justLoggedOut) {
      console.log('Login: Detected just_logged_out flag');
      setWasLoggedOut(true);
      setIsCheckingAuth(false);
      // Don't remove the flag yet - will be handled by authentication check
    } else {
      setIsCheckingAuth(true);
    }
  }, []);
  
  // Session query - disabled immediately after logout
  const { data: userSession, isLoading } = useQuery<SessionData>({
    queryKey: ['/api/auth/session'],
    retry: wasLoggedOut ? 0 : 3,
    enabled: !wasLoggedOut,
  });
  
  // Handle auth check completion
  useEffect(() => {
    if (!isLoading) {
      setIsCheckingAuth(false);
      // If auth check completed and we were logged out, clear the flag
      if (wasLoggedOut) {
        console.log('Login: Clearing just_logged_out flag after auth check');
        sessionStorage.removeItem('just_logged_out');
      }
    }
  }, [isLoading, wasLoggedOut]);
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isCheckingAuth && !wasLoggedOut && userSession?.user?.username) {
      console.log('Login page: Valid session found, redirecting to dashboard');
      
      // Use a slight delay to ensure any pending state updates complete
      const redirectTimer = setTimeout(() => {
        setLocation(`/${userSession.user.username}/dashboard`);
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [userSession, isCheckingAuth, wasLoggedOut, setLocation]);
  
  // Show loading state when checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-primary-600 animate-pulse">Checking authentication...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={false} />
      
      <div className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
    </div>
  );
}
