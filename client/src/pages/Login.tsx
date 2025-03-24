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
  
  const { data: sessionData, isLoading } = useQuery<SessionData>({
    queryKey: ['/api/auth/session'],
  });
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && sessionData?.user) {
      setLocation('/dashboard');
    }
  }, [sessionData, isLoading, setLocation]);
  
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
