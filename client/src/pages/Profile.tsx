import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, MapPin, Award, Calendar, Building } from "lucide-react";
import PropertyCard from "@/components/dashboard/PropertyCard";
import { Link } from "wouter";

interface ProfileProps {
  username?: string;
}

export default function Profile({ username }: ProfileProps = {}) {
  const { data: userSession } = useQuery({
    queryKey: ['/api/auth/session'],
  });
  
  // If a username is provided in the URL, fetch that user's profile
  // Otherwise fetch the current logged-in user's profile
  const { data: userData } = useQuery({
    queryKey: username ? [`/api/users/${username}`] : ['/api/user'],
    enabled: username ? true : !!userSession?.user,
  });
  
  const isOwnProfile = !username || (userSession?.user && userSession.user.username === username);
  
  // Get listings for the profile based on whether it's the user's own profile or another user
  const { data: listings } = useQuery({
    queryKey: username ? [`/api/users/${username}/listings`] : ['/api/listings'],
    enabled: true, // Always enabled for public profiles
  });
  
  // Profile data from API with fallbacks
  const profileData = {
    name: userData?.fullName || userSession?.user?.username || "Agent Name",
    title: userData?.title || "Real Estate Professional",
    phone: userData?.phone || "Contact for details",
    email: userData?.email || userSession?.user?.email || "Contact for details",
    location: userData?.location || "Location not specified",
    bio: userData?.bio || "No bio provided",
    specialties: userData?.specialties || ["No specialties listed"],
    experience: userData?.experience || "Not specified",
    licenses: userData?.licenses || ["No licenses listed"],
    profileImage: userData?.profileImage || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&h=200&q=80"
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!userSession?.user} />
      
      <div className="flex-grow flex">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            {isOwnProfile && <EmailVerificationAlert />}
            
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                  {isOwnProfile ? "My Profile" : `${profileData.name}'s Profile`}
                </h1>
                {isOwnProfile && (
                  <Link href="/settings">
                    <Button variant="outline">
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex flex-col items-center">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                        <img 
                          src={profileData.profileImage} 
                          alt={profileData.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="mt-4 text-center">
                        <h2 className="text-xl font-bold">{profileData.name}</h2>
                        <p className="text-muted-foreground">{profileData.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span>{profileData.email}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span>{profileData.phone}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span>{profileData.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                            <span>{profileData.experience}</span>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-2">About Me</h3>
                          <p className="text-muted-foreground">{profileData.bio}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-2">Specialties</h3>
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(profileData.specialties) && profileData.specialties.map((specialty, index) => (
                              <span 
                                key={index} 
                                className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-2">Licenses & Certifications</h3>
                          <ul className="space-y-1">
                            {Array.isArray(profileData.licenses) && profileData.licenses.map((license, index) => (
                              <li key={index} className="flex items-center">
                                <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{license}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Tabs defaultValue="listings">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="listings">
                    {isOwnProfile ? "My Listings" : `${profileData.name.split(' ')[0]}'s Listings`}
                  </TabsTrigger>
                  <TabsTrigger value="activity">
                    {isOwnProfile ? "Recent Activity" : "Activity"}
                  </TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="listings" className="mt-6">
                  {listings && listings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {listings.map((listing) => (
                        <PropertyCard key={listing.id} listing={listing} />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No listings yet</h3>
                        <p className="text-muted-foreground mb-6">
                          {isOwnProfile 
                            ? "You haven't created any listings yet" 
                            : `${profileData.name} hasn't created any listings yet`}
                        </p>
                        {isOwnProfile && (
                          <Link href="/listing/create">
                            <Button>Create Your First Listing</Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="activity" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        {isOwnProfile 
                          ? "Your recent actions and notifications" 
                          : `${profileData.name.split(' ')[0]}'s recent activity`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-6">
                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No recent activity</h3>
                        <p className="text-muted-foreground">
                          {isOwnProfile
                            ? "Your recent activities will be displayed here"
                            : "No recent activities to display"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="reviews" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Client Reviews</CardTitle>
                      <CardDescription>
                        {isOwnProfile 
                          ? "Feedback from your clients" 
                          : `What clients say about ${profileData.name.split(' ')[0]}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-6">
                        <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
                        <p className="text-muted-foreground">
                          {isOwnProfile
                            ? "Client reviews will appear here once you receive them"
                            : `${profileData.name.split(' ')[0]} hasn't received any reviews yet`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
