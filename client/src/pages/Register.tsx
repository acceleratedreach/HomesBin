import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import RegisterForm from "@/components/auth/RegisterForm";

interface UserData {
  id: number;
  username: string;
  email: string;
  emailVerified?: boolean;
}

interface SessionData {
  user: UserData;
}

export default function Register() {
  const [, setLocation] = useLocation();
  
  const { data: sessionData } = useQuery<SessionData>({
    queryKey: ['/api/auth/session'],
  });
  
  // Redirect to user's dashboard if already logged in
  useEffect(() => {
    if (sessionData?.user) {
      const username = sessionData.user.username;
      setLocation(`/${username}/dashboard`);
    }
  }, [sessionData, setLocation]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <RegisterForm />
      </div>
    </div>
  );
}
