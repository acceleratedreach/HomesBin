import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import LoginForm from "@/components/auth/LoginForm";

export default function Login() {
  const [location, setLocation] = useLocation();
  const [wasLoggedOut, setWasLoggedOut] = useState<boolean>(false);
  
  // Check if we just logged out
  useEffect(() => {
    const justLoggedOut = sessionStorage.getItem('just_logged_out') === 'true';
    if (justLoggedOut) {
      setWasLoggedOut(true);
      // Clear the flag
      sessionStorage.removeItem('just_logged_out');
    }
  }, []);
  
  const { data: userSession, isLoading } = useQuery({
    queryKey: ['/api/auth/session'],
    // Avoid redirects immediately after logout
    enabled: !wasLoggedOut,
    retry: wasLoggedOut ? 0 : 3
  });
  
  // Redirect to user-specific dashboard if already logged in
  useEffect(() => {
    if (!isLoading && !wasLoggedOut && userSession?.user?.username) {
      console.log('Login page: user session exists, redirecting to dashboard', userSession);
      setLocation(`/${userSession.user.username}/dashboard`);
    }
  }, [userSession, isLoading, setLocation, wasLoggedOut]);
  
  // Clear the "just logged out" flag if we navigate away from login
  useEffect(() => {
    return () => {
      if (location !== '/login') {
        sessionStorage.removeItem('just_logged_out');
      }
    };
  }, [location]);
  
  if (isLoading && !wasLoggedOut) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
    </div>
  );
}
