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
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

interface UserData {
  id: string;
  username?: string;
  email?: string;
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
  const { user, isAuthenticated, loading: authLoading } = useSupabaseAuth();
  
  // Get username from URL params
  const usernameFromUrl = params.username;
  
  // User form state
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  
  // Get profile data for the authenticated user
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['settings-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile for settings:', error);
          return null;
        }
        
        return data;
      } catch (e) {
        console.error('Exception in profile query for settings:', e);
        return null;
      }
    },
    enabled: !!user?.id && isAuthenticated,
  });
  
  // Initialize form with data when available
  useEffect(() => {
    if (profileData) {
      setFormData({
        fullName: profileData.full_name || "",
        title: profileData.title || "",
        email: user?.email || "",
        phone: profileData.phone || "",
        location: profileData.location || "",
        experience: profileData.experience || "",
        bio: profileData.bio || "",
        specialties: profileData.specialties || [],
        licenses: profileData.licenses || [],
        avatar: profileData.avatar_url || ""
      });
    } else if (user) {
      // Use data from the auth user if profile data isn't available
      setFormData({
        fullName: user.user_metadata?.full_name || "",
        email: user.email || "",
        // Use auth user metadata for other fields
        username: user.user_metadata?.username || user.email?.split('@')[0] || ""
      });
    }
  }, [profileData, user]);
  
  // Construct user info from Supabase auth + profile
  const userData = user ? {
    id: user.id,
    username: profileData?.username || user.user_metadata?.username || user.email?.split('@')[0] || '',
    email: user.email || '',
    fullName: profileData?.full_name || user.user_metadata?.full_name || '',
    emailVerified: !!user.email_confirmed_at,
    // Add other properties from profileData
    title: profileData?.title || '',
    phone: profileData?.phone || '',
    location: profileData?.location || '',
    experience: profileData?.experience || '',
    bio: profileData?.bio || '',
    specialties: profileData?.specialties || [],
    licenses: profileData?.licenses || [],
    avatar: profileData?.avatar_url || ''
  } : null;
  
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
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-lg mb-2">Loading settings...</p>
        <p className="text-sm text-muted-foreground">Retrieving your profile information...</p>
      </div>
    );
  }
  
  // If no user data, show a message
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-lg mb-2">Authentication required</p>
        <p className="text-sm text-muted-foreground mb-4">Please log in to view your settings</p>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </div>
    );
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
  
  // Save profile data directly to Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setSaveError("");
    
    try {
      // Map form data to the expected format for the profiles table
      const profileUpdateData = {
        full_name: formData.fullName,
        title: formData.title,
        phone: formData.phone,
        location: formData.location,
        experience: formData.experience,
        bio: formData.bio,
        specialties: formData.specialties,
        licenses: formData.licenses,
        avatar_url: formData.avatar,
        updated_at: new Date().toISOString()
      };
      
      // Update the profile
      const { error } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', user.id);
      
      if (error) {
        console.error('Error updating profile:', error);
        setSaveError(error.message);
        return;
      }
      
      // Refresh the profile data
      queryClient.invalidateQueries({ queryKey: ['settings-profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['supabase-profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['supabase-profile-sidebar', user.id] });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Exception updating profile:', error);
      setSaveError(error.message || "An error occurred while saving");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={true} />
      
      <div className="flex-grow flex">
        <DashboardSidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
            
            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded mb-6">
                Profile updated successfully!
              </div>
            )}
            
            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
                Error: {saveError}
              </div>
            )}
            
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
                    <Button type="submit" className="w-full md:w-auto">
                      Save Profile
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
