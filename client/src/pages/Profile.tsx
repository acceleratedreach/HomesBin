import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, MapPin, Award, Calendar, Building } from "lucide-react";
import PropertyCard from "@/components/dashboard/PropertyCard";
import { ProfessionalTemplate, ModernTemplate, VibrantTemplate } from "@/components/profile/templates";
import { ProfileTemplateProps } from "@/components/profile/templates";
import SupabaseProfileData from "@/components/profile/SupabaseProfileData";
import SupabaseExample from "@/components/supabase/SupabaseExample";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { fetchFromSupabase } from "@/lib/supabase";

interface ProfileProps {
  username?: string;
}

interface UserData {
  id: number | string;
  username: string;
  email: string;
  fullName?: string;
  emailVerified?: boolean;
  profileImage?: string;
  title?: string;
  phone?: string;
  location?: string;
  experience?: string;
  bio?: string;
  specialties?: string[];
  licenses?: string[];
}

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
  darkMode: boolean;
  template?: string;
}

export default function Profile({ username }: ProfileProps = {}) {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useSupabaseAuth();
  
  // Determine the username to display (from props or current user)
  const displayUsername = username || user?.user_metadata?.username || user?.email?.split('@')[0];
  
  // Get user profile data from Supabase
  const { data: profileData, isLoading: loadingUserData } = useQuery({
    queryKey: ['/api/supabase/profiles', displayUsername],
    queryFn: async () => {
      try {
        const data = await fetchFromSupabase('profiles', {
          filters: { username: displayUsername }
        });
        return data?.[0] || null;
      } catch (error) {
        console.error('Error fetching profile data:', error);
        return null;
      }
    },
    enabled: !!displayUsername,
  });
  
  // Construct the user data object from Supabase profile data
  const userData: UserData = profileData ? {
    id: profileData.id || user?.id || '',
    username: profileData.username || displayUsername || '',
    email: profileData.email || user?.email || '',
    fullName: profileData.full_name || user?.user_metadata?.full_name || 'Real Estate Professional',
    emailVerified: !!user?.email_confirmed_at,
    profileImage: profileData.avatar_url || '',
    title: profileData.title || user?.user_metadata?.title || 'Licensed Agent',
    phone: profileData.phone || user?.user_metadata?.phone || '',
    location: profileData.location || user?.user_metadata?.location || '',
    experience: profileData.experience || '',
    bio: profileData.bio || '',
    specialties: Array.isArray(profileData.specialties) ? profileData.specialties : [],
    licenses: Array.isArray(profileData.licenses) ? profileData.licenses : [],
  } : {
    id: user?.id || '',
    username: displayUsername || '',
    email: user?.email || '',
    fullName: user?.user_metadata?.full_name || 'Real Estate Professional',
    emailVerified: !!user?.email_confirmed_at,
    title: user?.user_metadata?.title || 'Licensed Agent',
    phone: user?.user_metadata?.phone || '',
    location: user?.user_metadata?.location || '',
  };
  
  // If no username is provided and the user is not logged in, redirect to login
  useEffect(() => {
    if (!username && !isAuthenticated) {
      navigate('/login');
    }
  }, [username, isAuthenticated, navigate]);
  
  // Fetch theme settings for this user
  const { data: themeSettings, isLoading: loadingTheme } = useQuery<ThemeSettings>({
    queryKey: ['/api/supabase/user_themes', userData.id],
    enabled: !!userData.id,
    // Default theme settings if none are set
    placeholderData: {
      primaryColor: "#4f46e5",
      secondaryColor: "#10b981",
      fontFamily: "Inter",
      borderRadius: "medium",
      darkMode: false,
      template: "ProfessionalTemplate"
    }
  });
  
  // Determine if this is the user's own profile
  const isOwnProfile = user && userData && 
                      (user.id === userData.id || user.email === userData.email);
  
  // Get listings for the profile from Supabase
  const { data: listings = [] } = useQuery({
    queryKey: ['/api/supabase/listings', userData.id],
    queryFn: async () => {
      try {
        return await fetchFromSupabase('listings', {
          filters: { user_id: userData.id }
        });
      } catch (error) {
        console.error('Error fetching listings:', error);
        return [];
      }
    },
    enabled: !!userData.id,
  });
  
  // If user data is available, use it; otherwise use minimal defaults (only for display purposes)
  const profileInfo = {
    name: userData?.fullName || userData?.username || "",
    title: userData?.title || "",
    phone: userData?.phone || "",
    email: userData?.email || "",
    location: userData?.location || "",
    bio: userData?.bio || "",
    specialties: userData?.specialties || [],
    experience: userData?.experience || "",
    licenses: userData?.licenses || [],
    profileImage: userData?.profileImage || ""
  };
  
  // Show loading state while data is being fetched
  if (loadingUserData || loadingTheme) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAuthenticated={isAuthenticated} />
        <div className="flex-grow flex items-center justify-center">
          <p>Loading profile information...</p>
        </div>
      </div>
    );
  }
  
  // Prepare template props
  const templateProps: ProfileTemplateProps = {
    userData: {
      id: userData?.id?.toString(),
      username: userData?.username || '',
      fullName: userData?.fullName || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      profileImage: userData?.profileImage || '',
      bio: userData?.bio || '',
      location: userData?.location || '',
      experience: userData?.experience || '',
      specialties: userData?.specialties || [],
      licenses: userData?.licenses || [],
      title: userData?.title || ''
    },
    listings: listings || [],
    theme: {
      primaryColor: themeSettings?.primaryColor || "#4f46e5",
      colorMode: themeSettings?.darkMode ? 'dark' : 'light',
      fontFamily: themeSettings?.fontFamily || "Inter",
      fontSize: 16,
      borderRadius: themeSettings?.borderRadius === "small" ? 4 : 
                   themeSettings?.borderRadius === "large" ? 12 : 8,
      socialLinksEnabled: true,
      contactFormEnabled: true,
      featuredListingsLayout: 'grid'
    },
    isOwnProfile: isOwnProfile || false
  };
  
  // Select the appropriate template component based on theme settings
  let SelectedTemplate = ProfessionalTemplate; // Default template
  
  if (themeSettings?.template) {
    switch (themeSettings.template) {
      case "ModernTemplate":
        SelectedTemplate = ModernTemplate;
        break;
      case "VibrantTemplate":
        SelectedTemplate = VibrantTemplate;
        break;
      case "ProfessionalTemplate":
      default:
        SelectedTemplate = ProfessionalTemplate;
        break;
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={isAuthenticated} />
      
      <div className="flex-grow">
        {isOwnProfile && <EmailVerificationAlert />}
        
        {/* Render the selected template */}
        <SelectedTemplate 
          userData={templateProps.userData}
          listings={templateProps.listings}
          theme={templateProps.theme}
          isOwnProfile={templateProps.isOwnProfile}
        />
        
        {/* Show Supabase Profile Data for own profile */}
        {isOwnProfile && userData?.id && (
          <div className="container max-w-7xl mx-auto mt-8 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SupabaseProfileData userId={userData.id.toString()} />
              <SupabaseExample userId={Number(userData.id)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
