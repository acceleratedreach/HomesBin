import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import Header from "@/components/layout/Header";
import DashboardSidebar from "@/components/layout/Sidebar";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import DashboardStats from "@/components/dashboard/DashboardStats";
import PropertyCard from "@/components/dashboard/PropertyCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BarChart2, UserPlus, Building, Calendar, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

interface UserData {
  id: number;
  username: string;
  email: string;
  emailVerified?: boolean;
  fullName?: string;
}

export default function Dashboard() {
  const params = useParams();
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useSupabaseAuth();
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);
  
  // Get username from URL params
  const usernameFromUrl = params.username;
  
  // Debug log
  useEffect(() => {
    console.log("Dashboard component state:", {
      authLoading,
      isAuthenticated,
      loadingCount,
      user: user ? { id: user.id.substring(0, 8) + '...', email: user.email } : null,
      usernameFromUrl
    });
  }, [authLoading, isAuthenticated, user, usernameFromUrl, loadingCount]);

  // Perform a direct session check with Supabase on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoadingCount(prev => prev + 1);
        console.log("Performing direct Supabase session check...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
        } else {
          console.log("Direct session check result:", {
            hasSession: !!data.session,
            userId: data.session?.user?.id ? `${data.session.user.id.substring(0, 8)}...` : null
          });
        }
        
        setInitialAuthCheckComplete(true);
        setLoadingCount(prev => prev - 1);
      } catch (err) {
        console.error("Exception during session check:", err);
        setInitialAuthCheckComplete(true);
        setLoadingCount(prev => prev - 1);
      }
    };
    
    checkSession();
  }, []);
  
  // Get profile data for the authenticated user - with error handling so it doesn't redirect
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['supabase-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      setLoadingCount(prev => prev + 1);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
          return null;
        }
        
        return data;
      } catch (e) {
        console.error('Exception in profile query:', e);
        return null;
      } finally {
        setLoadingCount(prev => prev - 1);
      }
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 1000
  });

  // Get listings for the user - with error handling so it doesn't redirect
  const { data: listings = [], isLoading: listingsLoading } = useQuery<any[]>({
    queryKey: ['/api/listings'],
    queryFn: async (): Promise<any[]> => {
      if (!user?.id) return [];
      setLoadingCount(prev => prev + 1);
      
      try {
        // Get access token from supabase
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        if (!token) {
          console.error('No access token available for listings request');
          return [];
        }
        
        // Make direct fetch with the token
        const response = await fetch('/api/listings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          console.warn('Listings API request failed:', response.status);
          return [];
        }
        
        const responseData = await response.json();
        return Array.isArray(responseData) ? responseData : [];
      } catch (e: any) {
        console.error('Exception in listings query:', e);
        return [];
      } finally {
        setLoadingCount(prev => prev - 1);
      }
    },
    enabled: !!user?.id && isAuthenticated,
    retry: 2,
    retryDelay: 1000
  });
  
  // Recent activity - would be fetched from API in a real app
  const recentActivity = [];
  
  // IMPORTANT: Only redirect to login if we're completely sure the user is not authenticated
  useEffect(() => {
    if (initialAuthCheckComplete && !authLoading && !isAuthenticated && loadingCount === 0) {
      console.log("Not authenticated, setting up timer before redirecting...");
      
      // Add a delay before redirecting to login to allow auth state to settle
      const redirectTimer = setTimeout(() => {
        // Double-check authentication status one more time before redirecting
        supabase.auth.getSession().then(({ data }) => {
          if (!data.session) {
            console.log("No session found after final check, redirecting to login...");
            navigate('/login', { replace: true });
          } else {
            console.log("Session found in final check, staying on dashboard");
            // Force refresh auth context
            window.location.reload();
          }
        }).catch(err => {
          console.error("Error in final session check:", err);
          navigate('/login', { replace: true });
        });
      }, 1500); // 1.5 second delay
      
      return () => clearTimeout(redirectTimer);
    }
  }, [initialAuthCheckComplete, authLoading, isAuthenticated, navigate, loadingCount]);
  
  // If we're directly accessing the /dashboard route, redirect to /:username/dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && !usernameFromUrl) {
      const username = profileData?.username || 
                       user.user_metadata?.username || 
                       user.email?.split('@')[0];
                       
      if (username) {
        console.log(`Redirecting to user-specific dashboard: /${username}/dashboard`);
        navigate(`/${username}/dashboard`, { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, user, profileData, usernameFromUrl, navigate]);
  
  // Check if user is accessing their own dashboard, redirect if not
  useEffect(() => {
    if (isAuthenticated && usernameFromUrl && user) {
      const currentUsername = profileData?.username || 
                              user.user_metadata?.username || 
                              user.email?.split('@')[0];
      
      if (currentUsername && usernameFromUrl !== currentUsername) {
        console.log(`User ${currentUsername} trying to access ${usernameFromUrl}'s dashboard, redirecting`);
        navigate(`/${currentUsername}/dashboard`, { replace: true });
      }
    }
  }, [isAuthenticated, user, profileData, usernameFromUrl, navigate]);
  
  // Show loading state while we check authentication
  if (authLoading || !initialAuthCheckComplete || loadingCount > 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-lg mb-2">Loading dashboard...</p>
        <p className="text-sm text-muted-foreground">Verifying your session...</p>
      </div>
    );
  }
  
  // Guard against not being authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-lg mb-2">Authentication required</p>
        <p className="text-sm text-muted-foreground mb-4">Please log in to view your dashboard</p>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </div>
    );
  }

  const userData = profileData || {
    id: user.id,
    email: user.email || '',
    username: user.user_metadata?.username || user.email?.split('@')[0] || '',
    fullName: user.user_metadata?.full_name || '',
    emailVerified: user.email_confirmed_at ? true : false
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={true} />
      
      <div className="flex-grow flex">
        <DashboardSidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            <EmailVerificationAlert />
            
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <Button asChild>
                  <Link href={`/${userData.username}/listings/new`}>
                    Create New Listing
                  </Link>
                </Button>
              </div>
              
              <p className="text-gray-500">
                Welcome back, {userData.fullName || userData.username}! Here's an overview of your account.
              </p>
            </div>
            
            <DashboardStats />
            
            <div className="mt-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Your Listings</h2>
                <Link href={`/${userData.username}/listings`} className="text-primary hover:underline text-sm">
                  View All Listings
                </Link>
              </div>
              
              {listingsLoading ? (
                <div className="text-center py-8">Loading listings...</div>
              ) : listings && listings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.slice(0, 3).map((listing: any) => (
                    <PropertyCard key={listing.id} listing={listing} />
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg border text-center">
                  <h3 className="text-gray-900 font-medium mb-2">No listings yet</h3>
                  <p className="text-gray-500 mb-4">Create your first property listing to showcase it to potential clients.</p>
                  <Button asChild>
                    <Link href={`/${userData.username}/listings/new`}>
                      Create New Listing
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            
            <div className="mt-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              </div>
              
              {recentActivity.length > 0 ? (
                <div className="bg-white rounded-lg border divide-y">
                  {/* Activity items would go here */}
                  <div className="p-4">
                    <span className="text-gray-500">No recent activity</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg border text-center">
                  <h3 className="text-gray-900 font-medium mb-2">No recent activity</h3>
                  <p className="text-gray-500">Your recent activities will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
