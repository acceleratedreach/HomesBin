import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Home } from "lucide-react";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { fetchFromSupabase } from "@/lib/supabase";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface HeaderProps {
  isAuthenticated?: boolean;
}

export default function Header({ isAuthenticated: propIsAuthenticated }: HeaderProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { signOut, user, isAuthenticated } = useSupabaseAuth();
  
  // Use auth from context if available, otherwise from props
  const authStatus = isAuthenticated !== undefined ? isAuthenticated : propIsAuthenticated;

  // Get user profile data from Supabase profiles table
  const { data: profileData } = useQuery({
    queryKey: ['/api/supabase/profiles', user?.id],
    queryFn: async () => {
      try {
        const data = await fetchFromSupabase('profiles', {
          filters: { id: user?.id }
        });
        return data?.[0] || null;
      } catch (error) {
        console.error('Error fetching profile data:', error);
        return null;
      }
    },
    enabled: !!authStatus && !!user?.id,
  });

  // Get user info by combining auth user and profile data
  const userData = {
    id: user?.id,
    email: user?.email,
    username: profileData?.username || user?.user_metadata?.username || user?.email?.split('@')[0],
    emailVerified: !!user?.email_confirmed_at,
    fullName: profileData?.full_name || user?.user_metadata?.full_name
  };

  // Handle logout action
  const handleLogout = async () => {
    try {
      console.log('Logging out user');
      const { error } = await signOut();
      
      if (error) {
        throw error;
      }
      
      // Clear all auth-related queries from cache
      queryClient.invalidateQueries({ queryKey: ['/api/supabase/profiles'] });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Force redirect to login page with page refresh to ensure clean state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <div className="bg-blue-500 text-white p-1.5 rounded-md mr-2">
                <Home className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">HomesBin</h1>
            </div>
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          
          {authStatus ? (
            <>
              <Button asChild variant="default" className="bg-blue-500 hover:bg-blue-600 rounded-md">
                <Link href={userData?.username ? `/${userData.username}/dashboard` : "/dashboard"}>Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="text-blue-500 border-blue-500">
                <Link href={userData?.username ? `/profile/${userData.username}` : "/profile"}>My Profile</Link>
              </Button>
              <Button asChild variant="ghost" className="text-primary">
                <Link href="/settings">Settings</Link>
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
