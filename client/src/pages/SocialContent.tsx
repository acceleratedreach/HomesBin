import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Header from "@/components/layout/Header";
import DashboardSidebar from "@/components/layout/Sidebar";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Facebook, Twitter, Instagram, Linkedin, Upload, MessageSquare, Calendar, Send, Plus, Copy, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  id: number;
  username: string;
  email: string;
  emailVerified?: boolean;
  fullName?: string;
}

export default function SocialContent() {
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

  // Get listings - with explicit type definition
  const { data: listings = [], isLoading: listingsLoading } = useQuery<any[]>({
    queryKey: ['/api/listings'],
    enabled: !!currentUser,
  });

  // Social platform state
  const [activeTab, setActiveTab] = useState("instagram");
  const [contentText, setContentText] = useState("");
  
  const { toast } = useToast();
  
  const { data: socialAccounts } = useQuery({
    queryKey: ['/api/social-accounts'],
  });
  
  const handlePostContent = () => {
    toast({
      title: "Post Created",
      description: "Your social media post has been scheduled for publishing.",
    });
    setOpenNewPost(false);
  };
  
  // Sample generated content
  const sampleContent = {
    instagram: [
      "Just listed this stunning 4-bedroom home in Oak Ridge! Modern finishes, open floor plan, and a backyard paradise. DM for details! #NewListing #RealEstate #DreamHome",
      "This charming colonial just hit the market! Features include hardwood floors, a chef's kitchen, and a private backyard oasis. Schedule your showing today! #JustListed #HomeSweetHome",
      "Market update: Inventory is low, but demand remains high in the metro area. Now is a great time to list your home! #RealEstateMarket #SellerMarket"
    ],
    facebook: [
      "NEW LISTING ALERT! 🏡 Gorgeous 4-bedroom, 3-bath home in desirable Oak Ridge neighborhood. This property won't last long! Click the link in bio to schedule a showing.",
      "Just closed on another beautiful home for my wonderful clients! Congratulations to the Smith family on their new chapter. It was a pleasure helping you find your dream home!",
      "Looking for a home with a view? This stunning property overlooks the entire valley and features floor-to-ceiling windows to maximize the breathtaking scenery."
    ],
    twitter: [
      "Just listed! Beautiful 4BR/3BA in Oak Ridge. Modern finishes, open concept living. DM for details! #RealEstate #NewListing",
      "Market Update: Median home prices up 5% from last year in our area. Great time to sell! #RealEstateMarket #HousingMarket",
      "Congrats to my clients on closing their dream home today! Persistence pays off in this market. #JustSold #HappyClients"
    ],
    linkedin: [
      "I'm excited to announce a new property just listed in the prestigious Oak Ridge neighborhood. This executive home features smart home technology, a home office, and resort-style outdoor living. Perfect for the discerning professional. #LuxuryRealEstate #NewListing",
      "Market Insight: Commercial real estate in our downtown district is showing strong signs of recovery, with occupancy rates increasing 15% over last quarter. #CommercialRealEstate #MarketAnalysis",
      "Proud to share that our team has helped 50 families find their dream homes this year! Looking to expand our reach in 2023. #RealEstateSuccess #TeamAchievement"
    ]
  };
  
  // If we're directly accessing the /social-content route, redirect to /:username/social-content
  useEffect(() => {
    if (!usernameFromUrl && userData?.username) {
      navigate(`/${userData.username}/social-content`, { replace: true });
    }
  }, [usernameFromUrl, userData, navigate]);
  
  // Check if user is authorized to view this page (can only view their own)
  useEffect(() => {
    if (usernameFromUrl && userData && usernameFromUrl !== userData.username) {
      // Redirect to their own social content page if trying to access someone else's
      navigate(`/${userData.username}/social-content`, { replace: true });
    }
  }, [usernameFromUrl, userData, navigate]);
  
  // Show loading state while we check authentication
  if (sessionLoading || userLoading) {
    return <div className="p-8">Loading social content dashboard...</div>;
  }
  
  // If no user data, show a message
  if (!userData) {
    return <div className="p-8">Please log in to view your social content dashboard</div>;
  }
  
  // Handle copying content to clipboard
  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real app, would show a toast notification here
    alert("Copied to clipboard!");
  };
  
  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-5 w-5" />;
      case "facebook":
        return <Facebook className="h-5 w-5" />;
      case "twitter":
        return <Twitter className="h-5 w-5" />;
      case "linkedin":
        return <Linkedin className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const [openNewPost, setOpenNewPost] = useState(false);
  
  // Handle generating content
  const handleGenerateContent = (listingId: number) => {
    // In a real app, this would generate content based on the listing
    toast({
      title: "Content Generated",
      description: "Social media content has been generated for your listing",
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!userData} />
      
      <div className="flex-grow flex">
        <DashboardSidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            <EmailVerificationAlert />
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">Social Content</h1>
                <p className="text-muted-foreground">
                  Create and manage social media content for your listings
                </p>
              </div>
              
              <Button onClick={() => setOpenNewPost(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Post
              </Button>
            </div>
            
            <Tabs defaultValue="posts">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="posts">Social Posts</TabsTrigger>
                <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="posts" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sampleContent[activeTab as keyof typeof sampleContent].map((content, idx) => (
                    <Card key={idx}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            {getPlatformIcon(activeTab)}
                            <CardTitle className="text-base">
                              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Post
                            </CardTitle>
                          </div>
                          <div className="text-xs bg-muted px-2 py-1 rounded-full">
                            {activeTab === "instagram" ? "Scheduled" : "Generated"}
                          </div>
                        </div>
                        <CardDescription>{new Date().toLocaleDateString()}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm">{content}</p>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleCopyContent(content)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                  
                  <Dialog open={openNewPost} onOpenChange={setOpenNewPost}>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create Social Media Post</DialogTitle>
                        <DialogDescription>
                          Create and schedule a post for your social media accounts
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="platform">Platform</Label>
                          <Select defaultValue="facebook">
                            <SelectTrigger id="platform">
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="facebook">Facebook</SelectItem>
                              <SelectItem value="instagram">Instagram</SelectItem>
                              <SelectItem value="twitter">Twitter</SelectItem>
                              <SelectItem value="linkedin">LinkedIn</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="listing">Associated Listing (Optional)</Label>
                          <Select>
                            <SelectTrigger id="listing">
                              <SelectValue placeholder="Select a listing" />
                            </SelectTrigger>
                            <SelectContent>
                              {listings && listings.map((listing) => (
                                <SelectItem key={listing.id} value={listing.id.toString()}>
                                  {listing.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="postContent">Post Content</Label>
                          <Textarea 
                            id="postContent" 
                            placeholder="Write your post content here..." 
                            rows={4}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Upload Image</Label>
                          <div className="border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center text-muted-foreground">
                            <Upload className="h-8 w-8 mb-2" />
                            <p className="text-sm mb-1">Drag & drop an image here</p>
                            <p className="text-xs">or</p>
                            <Button variant="outline" size="sm" className="mt-2">
                              Browse Files
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="schedule">When to Post</Label>
                            <Select defaultValue="now">
                              <SelectTrigger id="schedule">
                                <SelectValue placeholder="Select when to post" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="now">Post Now</SelectItem>
                                <SelectItem value="schedule">Schedule</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="postDate">Schedule Date</Label>
                            <Input id="postDate" type="date" />
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2 mt-4">
                          <Button variant="outline" onClick={() => setOpenNewPost(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handlePostContent}>
                            <Send className="h-4 w-4 mr-2" />
                            Create Post
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </TabsContent>
              
              <TabsContent value="calendar" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Calendar</CardTitle>
                    <CardDescription>Schedule and plan your social media content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Content calendar coming soon</h3>
                      <p className="text-muted-foreground mb-6">
                        The content calendar feature will help you plan and schedule your social media posts
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
