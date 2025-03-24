import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Facebook, Twitter, Instagram, Linkedin, Upload, MessageSquare, Calendar, Send, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SocialContent() {
  const [openNewPost, setOpenNewPost] = useState(false);
  const { toast } = useToast();
  
  const { data: userSession } = useQuery({
    queryKey: ['/api/auth/session'],
  });
  
  const { data: listings } = useQuery({
    queryKey: ['/api/listings'],
  });
  
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
  
  // Sample post data for demonstration
  const samplePosts = [
    {
      id: 1,
      content: "Excited to announce a new listing! This beautiful 4-bed, 3-bath home in the heart of Westwood is now available. Contact me for details! #realestate #newlisting",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
      platform: "facebook",
      status: "published",
      date: "2023-06-15",
      engagement: {
        likes: 24,
        comments: 8,
        shares: 3
      }
    },
    {
      id: 2,
      content: "Just listed! Stunning 3-bedroom condo with amazing city views. Modern finishes throughout and an open floor plan perfect for entertaining. #dreamhome #realestate",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      platform: "instagram",
      status: "scheduled",
      date: "2023-06-22",
      engagement: null
    }
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!userSession?.user} />
      
      <div className="flex-grow flex">
        <Sidebar />
        
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
                  {samplePosts.map(post => (
                    <Card key={post.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            {post.platform === "facebook" && <Facebook className="h-5 w-5 text-blue-600 mr-2" />}
                            {post.platform === "twitter" && <Twitter className="h-5 w-5 text-blue-400 mr-2" />}
                            {post.platform === "instagram" && <Instagram className="h-5 w-5 text-pink-600 mr-2" />}
                            {post.platform === "linkedin" && <Linkedin className="h-5 w-5 text-blue-700 mr-2" />}
                            <CardTitle className="text-base">
                              {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)} Post
                            </CardTitle>
                          </div>
                          <div className="text-xs bg-muted px-2 py-1 rounded-full">
                            {post.status === "published" ? "Published" : "Scheduled"}
                          </div>
                        </div>
                        <CardDescription>{new Date(post.date).toLocaleDateString()}</CardDescription>
                      </CardHeader>
                      {post.image && (
                        <div className="px-6">
                          <img 
                            src={post.image} 
                            alt="Social media post" 
                            className="rounded-md w-full h-48 object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="pt-4">
                        <p className="text-sm">{post.content}</p>
                        
                        {post.engagement && (
                          <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                            <span>{post.engagement.likes} Likes</span>
                            <span>{post.engagement.comments} Comments</span>
                            <span>{post.engagement.shares} Shares</span>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm">Delete</Button>
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
