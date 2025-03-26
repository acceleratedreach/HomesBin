import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Header from "@/components/layout/Header";
import DashboardSidebar from "@/components/layout/Sidebar";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import EmailTemplateForm from "@/components/marketing/EmailTemplateForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Plus, Send, Copy, X, Edit, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate } from "@shared/schema";
import { Link } from "wouter";

interface UserData {
  id: number;
  username: string;
  email: string;
  emailVerified?: boolean;
  fullName?: string;
}

interface Campaign {
  id: number;
  name: string;
  subject: string;
  status: "draft" | "scheduled" | "sent";
  sentDate?: string;
  openRate?: number;
  clickRate?: number;
  recipients: number;
}

export default function EmailMarketing() {
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

  // Get email campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
    enabled: !!currentUser,
  });
  
  // Sample contact list data
  const contactLists = [
    { id: 1, name: "All Contacts", count: 124 },
    { id: 2, name: "Buyers", count: 56 },
    { id: 3, name: "Sellers", count: 42 },
    { id: 4, name: "Past Clients", count: 78 },
  ];
  
  // State for active tab
  const [activeTab, setActiveTab] = useState("campaigns");
  
  // If we're directly accessing the /email-marketing route, redirect to /:username/email-marketing
  useEffect(() => {
    if (!usernameFromUrl && userData?.username) {
      navigate(`/${userData.username}/email-marketing`, { replace: true });
    }
  }, [usernameFromUrl, userData, navigate]);
  
  // Check if user is authorized to view this page (can only view their own)
  useEffect(() => {
    if (usernameFromUrl && userData && usernameFromUrl !== userData.username) {
      // Redirect to their own email marketing page if trying to access someone else's
      navigate(`/${userData.username}/email-marketing`, { replace: true });
    }
  }, [usernameFromUrl, userData, navigate]);
  
  // Show loading state while we check authentication
  if (sessionLoading || userLoading) {
    return <div className="p-8">Loading email marketing dashboard...</div>;
  }
  
  // If no user data, show a message
  if (!userData) {
    return <div className="p-8">Please log in to view your email marketing dashboard</div>;
  }
  
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
                <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
                <p className="text-gray-500 mt-1">
                  Create and manage your email marketing campaigns
                </p>
              </div>
              
              <Button asChild>
                <Link href={`/${userData.username}/email-marketing/new`}>
                  <Plus className="h-4 w-4 mr-2" /> Create Campaign
                </Link>
              </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="campaigns">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Campaigns</CardTitle>
                        <CardDescription>Your recent email marketing campaigns</CardDescription>
                        </CardHeader>
                        <CardContent>
                        {campaignsLoading ? (
                          <div className="text-center py-8">Loading campaigns...</div>
                        ) : campaigns.length > 0 ? (
                          <div className="divide-y">
                            {campaigns.map((campaign) => (
                              <div key={campaign.id} className="py-4 flex justify-between items-center">
                                <div>
                                  <h3 className="font-medium">{campaign.name}</h3>
                                  <p className="text-sm text-gray-500">
                                    {campaign.status === "sent" 
                                      ? `Sent on ${campaign.sentDate}` 
                                      : campaign.status === "scheduled" 
                                        ? "Scheduled" 
                                        : "Draft"}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-4">
                                  {campaign.status === "sent" && (
                                    <div className="text-sm">
                                      <span className="text-gray-500">Opens: </span>
                                      <span className="font-medium">{campaign.openRate}%</span>
                                    </div>
                                  )}
                                  <Button 
                                    variant={campaign.status === "draft" ? "default" : "outline"}
                                    size="sm"
                                  >
                                    {campaign.status === "draft" ? "Edit" : "View"}
                          </Button>
                                </div>
                              </div>
                    ))}
                  </div>
                ) : (
                          <div className="text-center py-8">
                            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                            <p className="text-gray-500 mb-6">
                              Create your first email campaign to engage with your clients
                            </p>
                            <Button asChild>
                              <Link href={`/${userData.username}/email-marketing/new`}>
                                <Plus className="h-4 w-4 mr-2" /> Create Campaign
                              </Link>
                      </Button>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                  </div>
                  
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle>Campaign Metrics</CardTitle>
                        <CardDescription>Performance overview</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="border rounded-lg p-4">
                            <p className="text-sm text-gray-500">Average Open Rate</p>
                            <p className="text-2xl font-bold">24.8%</p>
                          </div>
                          <div className="border rounded-lg p-4">
                            <p className="text-sm text-gray-500">Average Click Rate</p>
                            <p className="text-2xl font-bold">3.2%</p>
                          </div>
                          <div className="border rounded-lg p-4">
                            <p className="text-sm text-gray-500">Total Subscribers</p>
                            <p className="text-2xl font-bold">{contactLists.reduce((sum, list) => sum + list.count, 0)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="templates">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                        <CardTitle>Email Templates</CardTitle>
                        <CardDescription>Pre-designed templates for your campaigns</CardDescription>
                  </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {["New Listing", "Open House", "Price Reduction", "Just Sold", "Market Update", "Holiday Greetings"].map((template, index) => (
                            <div key={index} className="border rounded-lg p-4 flex justify-between items-center">
                              <div>
                                <h3 className="font-medium">{template}</h3>
                                <p className="text-sm text-gray-500">
                                  {index < 4 ? "Property Template" : "Newsletter Template"}
                                </p>
                              </div>
                              <Button variant="outline" size="sm">Use</Button>
                      </div>
                          ))}
                      </div>
                      </CardContent>
                    </Card>
                    </div>
                    
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle>Template Builder</CardTitle>
                        <CardDescription>Create a custom template</CardDescription>
                      </CardHeader>
                      <CardContent>
                    <div className="space-y-4">
                          <p className="text-sm text-gray-500">
                            Design a custom email template to match your brand
                          </p>
                          <div className="space-y-2">
                            <Label htmlFor="template-name">Template Name</Label>
                            <Input id="template-name" placeholder="My Custom Template" />
                          </div>
                          <Button className="w-full">Create Custom Template</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="contacts">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <div>
                          <CardTitle>Contact Lists</CardTitle>
                          <CardDescription>Manage your subscriber lists</CardDescription>
                        </div>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" /> New List
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="divide-y">
                          {contactLists.map((list) => (
                            <div key={list.id} className="py-4 flex justify-between items-center">
                              <div>
                                <h3 className="font-medium">{list.name}</h3>
                                <p className="text-sm text-gray-500">{list.count} contacts</p>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">View</Button>
                                <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle>Import Contacts</CardTitle>
                        <CardDescription>Add contacts from a file</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-500">
                            Upload a CSV file with your contacts
                          </p>
                          <div className="border border-dashed rounded-lg p-6 text-center">
                            <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 mb-2">
                              Drag and drop a file or click to browse
                            </p>
                            <Button variant="outline" size="sm">Select File</Button>
                          </div>
                          <Button className="w-full" disabled>Upload Contacts</Button>
                        </div>
                      </CardContent>
                    </Card>
                      </div>
                    </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
