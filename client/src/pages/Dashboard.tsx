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
import { useEffect } from "react";

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
  
  // Get username from URL params
  const usernameFromUrl = params.username;
  
  // Get current user session
  const { data: sessionData, isLoading: sessionLoading } = useQuery<{ user: UserData }>({
    queryKey: ['/api/auth/session'],
  });
  
  const currentUser = sessionData?.user;
  
  // Fetch user data 
  const { data: userData, isLoading: userLoading } = useQuery<UserData>({
    queryKey: ['/api/user'],
    enabled: !!currentUser,
  });

  // Get listings for the user
  const { data: listings = [], isLoading: listingsLoading } = useQuery<any[]>({
    queryKey: ['/api/listings'],
    enabled: !!currentUser,
  });
  
  // Recent activity - would be fetched from API in a real app
  const recentActivity = [];
  
  // If we're directly accessing the /dashboard route, redirect to /:username/dashboard
  useEffect(() => {
    if (!usernameFromUrl && userData?.username) {
      navigate(`/${userData.username}/dashboard`, { replace: true });
    }
  }, [usernameFromUrl, userData, navigate]);
  
  // Check if user is authorized to view this dashboard (can only view their own)
  useEffect(() => {
    if (usernameFromUrl && userData && usernameFromUrl !== userData.username) {
      // Redirect to their own dashboard if trying to access someone else's
      navigate(`/${userData.username}/dashboard`, { replace: true });
    }
  }, [usernameFromUrl, userData, navigate]);
  
  // Show loading state while we check authentication
  if (sessionLoading || userLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }
  
  // If no user data, show a message
  if (!userData) {
    return <div className="p-8">Please log in to view your dashboard</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!userData} />
      
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
              ) : listings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.slice(0, 3).map((listing) => (
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
