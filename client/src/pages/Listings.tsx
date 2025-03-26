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
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // If we're directly accessing the /listings route, redirect to /:username/listings
  useEffect(() => {
    if (!usernameFromUrl && userData?.username) {
      navigate(`/${userData.username}/listings`, { replace: true });
    }
  }, [usernameFromUrl, userData, navigate]);
  
  // Check if user is authorized to view these listings (can only view their own)
  useEffect(() => {
    if (usernameFromUrl && userData && usernameFromUrl !== userData.username) {
      // Redirect to their own listings if trying to access someone else's
      navigate(`/${userData.username}/listings`, { replace: true });
    }
  }, [usernameFromUrl, userData, navigate]);
  
  // Show loading state while we check authentication
  if (sessionLoading || userLoading) {
    return <div className="p-8">Loading listings...</div>;
  }
  
  // If no user data, show a message
  if (!userData) {
    return <div className="p-8">Please log in to view your listings</div>;
  }
  
  // Filter listings based on search and status
  const filteredListings = listings.filter(listing => {
    const matchesSearch = searchQuery === "" || 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!userData} />
      
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
                <Link href={`/${userData.username}/listings/new`}>
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
            ) : filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
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
                      <Link href={`/${userData.username}/listings/new`}>
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
