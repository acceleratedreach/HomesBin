import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useParams, useLocation } from "wouter";
import Header from "@/components/layout/Header";
import DashboardSidebar from "@/components/layout/Sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";

interface UserData {
  id: number;
    username: string;
    email: string;
  emailVerified?: boolean;
  fullName?: string;
  title?: string;
  phone?: string;
  location?: string;
  experience?: string;
  bio?: string;
  specialties?: string[];
  licenses?: string[];
  avatar?: string;
}

export default function Settings() {
  const params = useParams();
  const [location, navigate] = useLocation();
  
  // Get username from URL params
  const usernameFromUrl = params.username;
  
  // User form state
  const [formData, setFormData] = useState<Partial<UserData>>({});
  
  // Get current user session
  const { data: sessionData, isLoading: sessionLoading } = useQuery<{ user: UserData }>({
    queryKey: ['/api/auth/session'],
  });
  
  const currentUser = sessionData?.user;
  
  // Fetch user data 
  const { data: userData, isLoading: userLoading } = useQuery<UserData>({
    queryKey: ['/api/user'],
    enabled: !!currentUser,
    onSuccess: (data) => {
      // Initialize form with user data
      setFormData({
        fullName: data.fullName || "",
        title: data.title || "",
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
        experience: data.experience || "",
        bio: data.bio || "",
        specialties: data.specialties || [],
        licenses: data.licenses || [],
      });
    }
  });
  
  // If we're directly accessing the /settings route, redirect to /:username/settings
  useEffect(() => {
    if (!usernameFromUrl && userData?.username) {
      navigate(`/${userData.username}/settings`, { replace: true });
    }
  }, [usernameFromUrl, userData, navigate]);
  
  // Check if user is authorized to view this settings page (can only view their own)
  useEffect(() => {
    if (usernameFromUrl && userData && usernameFromUrl !== userData.username) {
      // Redirect to their own settings if trying to access someone else's
      navigate(`/${userData.username}/settings`, { replace: true });
    }
  }, [usernameFromUrl, userData, navigate]);
  
  // Show loading state while we check authentication
  if (sessionLoading || userLoading) {
    return <div className="p-8">Loading settings...</div>;
  }
  
  // If no user data, show a message
  if (!userData) {
    return <div className="p-8">Please log in to view your settings</div>;
  }
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle specialty changes
  const handleSpecialtiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const specialtiesStr = e.target.value;
    const specialtiesArray = specialtiesStr.split(',').map((s) => s.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, specialties: specialtiesArray }));
  };
  
  // Handle license changes
  const handleLicensesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const licensesStr = e.target.value;
    const licensesArray = licensesStr.split(',').map((s) => s.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, licenses: licensesArray }));
  };
  
  // Save profile data
  const saveProfile = useMutation({
    mutationFn: async (data: Partial<UserData>) => {
      return await fetch('/api/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to update profile');
        }
        return res.json();
      });
    },
    onSuccess: () => {
      // Invalidate user data query to refresh with new data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      alert('Profile updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfile.mutate(formData);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!userData} />
      
      <div className="flex-grow flex">
        <DashboardSidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
            
            <Tabs defaultValue="profile" className="space-y-8">
              <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-grid">
                <TabsTrigger value="profile">Profile Information</TabsTrigger>
                <TabsTrigger value="account">Account Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName || ""}
                        onChange={handleChange}
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="title">Professional Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title || ""}
                        onChange={handleChange}
                        placeholder="Real Estate Agent"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        placeholder="john@example.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleChange}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location || ""}
                        onChange={handleChange}
                        placeholder="Los Angeles, CA"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        name="experience"
                        value={formData.experience || ""}
                        onChange={handleChange}
                        placeholder="5 years"
                      />
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio || ""}
                        onChange={handleChange}
                        placeholder="Tell potential clients about yourself"
                        className="h-32"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="specialties">Specialties (comma separated)</Label>
                      <Input
                        id="specialties"
                        name="specialties"
                        value={formData.specialties?.join(", ") || ""}
                        onChange={handleSpecialtiesChange}
                        placeholder="Residential, Commercial, Luxury"
                      />
                    </div>
                    
              <div>
                      <Label htmlFor="licenses">Licenses & Certifications (comma separated)</Label>
                      <Input
                        id="licenses"
                        name="licenses"
                        value={formData.licenses?.join(", ") || ""}
                        onChange={handleLicensesChange}
                        placeholder="CA DRE #01234567"
                      />
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                      <Label htmlFor="avatar">Profile Photo</Label>
                      <div className="mt-1 flex items-center">
                        <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mr-4">
                          {userData.avatar ? (
                            <img src={userData.avatar} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-gray-400 text-xs text-center">No image</span>
                          )}
                        </div>
                        <Button type="button" variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Photo
                        </Button>
                      </div>
                    </div>
              </div>
              
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={saveProfile.isPending}
                    >
                      {saveProfile.isPending ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="account" className="space-y-6">
                <div className="bg-white p-6 rounded-lg border">
                  <h2 className="text-lg font-medium mb-4">Account Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={userData.username}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Your username cannot be changed</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="email-settings">Email Address</Label>
                      <Input
                        id="email-settings"
                        value={userData.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {userData.emailVerified 
                          ? "Your email is verified" 
                          : "Please verify your email address"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button variant="outline" className="mr-4">Change Password</Button>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg border">
                  <h2 className="text-lg font-medium mb-4">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="email-notifications" 
                        className="h-4 w-4 text-primary border-gray-300 rounded"
                        defaultChecked 
                      />
                      <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-900">
                        Email notifications
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="sms-notifications" 
                        className="h-4 w-4 text-primary border-gray-300 rounded" 
                      />
                      <label htmlFor="sms-notifications" className="ml-2 block text-sm text-gray-900">
                        SMS notifications
                      </label>
                      </div>
                    
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="marketing-emails" 
                        className="h-4 w-4 text-primary border-gray-300 rounded"
                        defaultChecked 
                      />
                      <label htmlFor="marketing-emails" className="ml-2 block text-sm text-gray-900">
                        Marketing emails
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button>Save Preferences</Button>
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
