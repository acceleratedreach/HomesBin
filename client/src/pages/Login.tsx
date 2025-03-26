import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import LoginForm from "@/components/auth/LoginForm";

interface UserData {
  id: number;
  username: string;
  email: string;
  emailVerified?: boolean;
}

interface SessionData {
  user: UserData;
}

export default function Login() {
  const [, setLocation] = useLocation();
  
  const { data: sessionData, isLoading, refetch } = useQuery<SessionData>({
    queryKey: ['/api/auth/session'],
    refetchInterval: 2000, // Frequent checks
    retry: 2
  });
  
  // Force refresh on mount
  useEffect(() => {
    // Immediate check
    refetch();
  }, [refetch]);
  
  // Debug session data
  useEffect(() => {
    console.log("Login page - Session data:", sessionData);
    console.log("Login page - isLoading:", isLoading);
    console.log("Login page - Current path:", window.location.pathname);
  }, [sessionData, isLoading]);
  
  // Redirect to user's dashboard if already logged in
  useEffect(() => {
    if (!isLoading && sessionData?.user) {
      console.log("Login page - Already authenticated, redirecting to dashboard");
      const username = sessionData.user.username;
      const dashboardUrl = `/${username}/dashboard`;
      
      // Direct browser navigation to avoid any React routing issues
      window.location.href = dashboardUrl;
    }
  }, [sessionData, isLoading, setLocation]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
    </div>
  );
}
