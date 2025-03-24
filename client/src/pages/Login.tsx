import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import LoginForm from "@/components/auth/LoginForm";

export default function Login() {
  const [, setLocation] = useLocation();
  
  const { data: userSession, isLoading } = useQuery({
    queryKey: ['/api/auth/session'],
  });
  
  // Redirect to user-specific dashboard if already logged in
  useEffect(() => {
    if (!isLoading && userSession?.user?.username) {
      setLocation(`/${userSession.user.username}/dashboard`);
    }
  }, [userSession, isLoading, setLocation]);
  
  if (isLoading) {
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
