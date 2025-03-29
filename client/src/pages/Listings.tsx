import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import Header from "@/components/layout/Header";
import DashboardSidebar from "@/components/layout/Sidebar";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import PropertyCard from "@/components/dashboard/PropertyCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, SortAsc, Building, Filter } from "lucide-react";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

interface UserData {
  id: number;
  username: string;
  email: string;
  emailVerified?: boolean;
  fullName?: string;
}

export default function Listings() {
  const params = useParams();
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useSupabaseAuth();
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);
  
  // Get username from URL params
  const usernameFromUrl = params.username;
  
  // Debug log
  useEffect(() => {
    console.log("Listings component state:", {
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
  const { data: userData, isLoading: userLoading } = useQuery({
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

  // Get listings for the user
  const { data: listings = [], isLoading: listingsLoading, error: listingsError } = useQuery<any[]>({
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
          // Don't throw here, just return empty array to prevent component errors
          return [];
        }
        
        try {
          const responseData = await response.json();
          return Array.isArray(responseData) ? responseData : [];
        } catch (parseError) {
          console.error('Error parsing listings response:', parseError);
          return [];
        }
      } catch (e: any) {
        console.error('Exception in listings query:', e);
        return [];
      } finally {
        setLoadingCount(prev => prev - 1);
      }
    },
    enabled: !!user?.id && isAuthenticated,
    retry: 2,
    retryDelay: 1000,
    // Add error handling at the query level
    onError: (error) => {
      console.error('Listings query error:', error);
    }
  });
  
  // If we're directly accessing the /listings route, redirect to /:username/listings
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && !usernameFromUrl) {
      const username = userData?.username || 
                       user.user_metadata?.username || 
                       user.email?.split('@')[0];
                       
      if (username) {
        console.log(`Redirecting to user-specific listings: /${username}/listings`);
        navigate(`/${username}/listings`, { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, user, userData, usernameFromUrl, navigate]);
  
  // Check if user is accessing their own listings, redirect if not
  useEffect(() => {
    if (isAuthenticated && usernameFromUrl && user) {
      const currentUsername = userData?.username || 
                              user.user_metadata?.username || 
                              user.email?.split('@')[0];
      
      if (currentUsername && usernameFromUrl !== currentUsername) {
        console.log(`User ${currentUsername} trying to access ${usernameFromUrl}'s listings, redirecting`);
        navigate(`/${currentUsername}/listings`, { replace: true });
      }
    }
  }, [isAuthenticated, user, userData, usernameFromUrl, navigate]);
  
  // IMPORTANT: Declare filtering state outside of any conditions
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Filter listings based on search and status - with safeguards
  const filteredListings = (listings || []).filter(listing => {
    // Add null checks to prevent errors
    if (!listing) return false;
    
    const matchesSearch = !searchQuery || 
      (listing.title && listing.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (listing.location && listing.location.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Simple mock data to show if API fails
  const mockListings = listingsError ? [
    { 
      id: 1, 
      title: "Sample Property (API Unavailable)",
      location: "Error loading data - please try again later",
      price: "$000,000",
      status: "active",
      imageUrl: "https://placehold.co/600x400?text=API+Error"
    }
  ] : [];

  // Return early if we're loading or not authenticated
  if (authLoading || !initialAuthCheckComplete || loadingCount > 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-lg mb-2">Loading listings...</p>
        <p className="text-sm text-muted-foreground">Verifying your session...</p>
      </div>
    );
  }
  
  // Guard against not being authenticated - should never hit this due to route protection
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-lg mb-2">Authentication required</p>
        <p className="text-sm text-muted-foreground mb-4">Please log in to view your listings</p>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </div>
    );
  }

  // Use username with fallbacks
  const username = usernameFromUrl || 
                   user.user_metadata?.username || 
                   user.email?.split('@')[0] || 
                   'user';

  // Determine which listings to show
  const displayListings = listingsError ? mockListings : filteredListings;

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!user} />
      
      <div className="flex-grow flex">
        <DashboardSidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            <EmailVerificationAlert />
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Your Listings</h1>
                <p className="text-gray-500 mt-1">
                  Manage all your property listings in one place
                </p>
              </div>
              
              <Button asChild>
                <Link href={`/${username}/listings/new`}>
                  <Plus className="h-4 w-4 mr-2" /> Create New Listing
                </Link>
              </Button>
            </div>
            
            <div className="bg-white p-4 rounded-lg border mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <Input
                    placeholder="Search by title or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="w-full md:w-48">
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {listingsLoading ? (
              <div className="text-center py-12">
                <p>Loading your listings...</p>
              </div>
            ) : displayListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayListings.map((listing) => (
                  <PropertyCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-lg border text-center">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                
                {searchQuery || statusFilter !== "all" ? (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No listings match your filters</h3>
                    <p className="text-gray-500 mb-6">Try adjusting your search criteria</p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
                    <p className="text-gray-500 mb-6">Create your first property listing to get started</p>
                    <Button asChild>
                      <Link href={`/${username}/listings/new`}>
                        <Plus className="h-4 w-4 mr-2" /> Create New Listing
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
