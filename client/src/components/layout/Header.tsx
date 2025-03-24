import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Home } from "lucide-react";

interface HeaderProps {
  isAuthenticated?: boolean;
}

export default function Header({ isAuthenticated }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
    enabled: !!isAuthenticated,
  });

  const handleLogout = async () => {
    try {
      // First set the flag that we're logging out (before API call)
      sessionStorage.setItem('just_logged_out', 'true');
      
      // Execute the logout API call
      await apiRequest('POST', '/api/auth/logout', {});
      
      // After successful logout, clear all query cache to force fresh state
      queryClient.clear();
      
      // Show success message
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      
      // Then redirect to login page
      setLocation('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear the flag if logout failed
      sessionStorage.removeItem('just_logged_out');
      
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <div className="bg-blue-500 text-white p-1.5 rounded-md mr-2">
                <Home className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">HomesBin</h1>
            </div>
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              <Button asChild variant="default" className="bg-blue-500 hover:bg-blue-600 rounded-md">
                <Link href={userData?.username ? `/${userData.username}/dashboard` : '/dashboard'}>Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="text-blue-500 border-blue-500">
                <Link href={userData?.username ? `/${userData.username}` : '/profile'}>My Profile</Link>
              </Button>
              <Button variant="ghost" onClick={handleLogout} className="text-gray-600">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" className="text-blue-500 border-blue-500">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild variant="default" className="bg-blue-500 hover:bg-blue-600 rounded-md">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
