import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import DashboardStats from "@/components/dashboard/DashboardStats";
import PropertyCard from "@/components/dashboard/PropertyCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BarChart2, UserPlus, Building, Calendar, Mail } from "lucide-react";

interface DashboardProps {
  username?: string;
}

export default function Dashboard({ username }: DashboardProps = {}) {
  const { data: userSession } = useQuery<{ user: { username: string } }>({
    queryKey: ['/api/auth/session'],
  });

  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
  });
  
  // If no username provided, use the current user's username
  const dashboardUsername = username || currentUser?.username;
  
  // Ensure we're on the correct user's dashboard
  const isOwnDashboard = userSession?.user && userSession.user.username === dashboardUsername;

  if (!isOwnDashboard) {
    return null; // This will be handled by the router's authentication logic
  }

  const { data: listings, isLoading: loadingListings } = useQuery({
    queryKey: ['/api/listings'],
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!userSession?.user} />
      
      <div className="flex-grow flex">
        {/* Always show sidebar in dashboard */}
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            <EmailVerificationAlert />
            
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <Button asChild>
                <Link href={`/${dashboardUsername}/listings/new`}>
                  <Plus className="h-4 w-4 mr-2" /> Add New Listing
                </Link>
              </Button>
            </div>
            
            <DashboardStats />
            
            <div className="mt-8">
              <Tabs defaultValue="recent-listings">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="recent-listings">Recent Listings</TabsTrigger>
                  <TabsTrigger value="recent-leads">Recent Leads</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming Tasks</TabsTrigger>
                </TabsList>
                
                <TabsContent value="recent-listings" className="mt-6">
                  {loadingListings ? (
                    <div className="text-center py-12">Loading listings...</div>
                  ) : listings && listings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {listings.slice(0, 3).map((listing) => (
                        <PropertyCard key={listing.id} listing={listing} />
                      ))}
                      {listings.length > 3 && (
                        <Card className="flex items-center justify-center">
                          <CardContent className="py-6 text-center">
                            <p className="mb-4 text-muted-foreground">
                              {listings.length - 3} more listings
                            </p>
                            <Button asChild variant="outline">
                              <Link href={`/${dashboardUsername}/listings`}>View All Listings</Link>
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No listings yet</h3>
                        <p className="text-muted-foreground mb-6">
                          Create your first property listing to get started
                        </p>
                        <Button asChild>
                          <Link href={`/${dashboardUsername}/listings/new`}>
                            <Plus className="h-4 w-4 mr-2" /> Create Listing
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="recent-leads" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Leads</CardTitle>
                      <CardDescription>Leads from all your marketing channels</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-6">
                        <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No leads yet</h3>
                        <p className="text-muted-foreground mb-6">
                          Leads will appear here when people show interest in your listings
                        </p>
                        <Button asChild variant="outline">
                          <Link href={`/${dashboardUsername}/email-marketing`}>
                            <Mail className="h-4 w-4 mr-2" /> Set Up Email Campaign
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="upcoming" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Upcoming Tasks</CardTitle>
                      <CardDescription>Your scheduled tasks and reminders</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-6">
                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No upcoming tasks</h3>
                        <p className="text-muted-foreground mb-6">
                          You don't have any scheduled tasks at the moment
                        </p>
                        <Button disabled variant="outline">
                          Add Task (Coming Soon)
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Overview of your marketing performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-48">
                    <BarChart2 className="h-16 w-16 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href={`/${dashboardUsername}/listings/new`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Listing
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href={`/${dashboardUsername}/email-marketing`}>
                        <Mail className="mr-2 h-4 w-4" />
                        Create Email Campaign
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href={`/${dashboardUsername}/listing-graphics`}>
                        <Building className="mr-2 h-4 w-4" />
                        Generate Listing Graphics
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href={`/${dashboardUsername}`}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Complete Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
