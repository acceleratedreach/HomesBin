import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import Header from "@/components/layout/Header";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, MapPin, Award, Calendar, Building } from "lucide-react";
import PropertyCard from "@/components/dashboard/PropertyCard";
import { ProfessionalTemplate, ModernTemplate, VibrantTemplate } from "@/components/profile/templates";
import { ProfileTemplateProps } from "@/components/profile/templates";

interface ProfileProps {
  username?: string;
}

interface UserData {
  id: number;
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
  const [location] = useLocation();
  
  // Get current user session
  const { data: sessionData } = useQuery<{ user: UserData }>({
    queryKey: ['/api/auth/session'],
  });
  
  // Determine the username to display (from props or current user)
  const displayUsername = username || sessionData?.user?.username;
  
  // Fetch user data based on which profile we're viewing
  const { data: userData, isLoading: loadingUserData } = useQuery<UserData>({
    queryKey: displayUsername ? 
      (displayUsername !== sessionData?.user?.username ? 
        [`/api/users/${displayUsername}`] : 
        ['/api/user']
      ) : ['/api/user'],
    enabled: !!displayUsername || !!sessionData?.user,
  });
  
  // Fetch theme settings for this user
  const { data: themeSettings, isLoading: loadingTheme } = useQuery<ThemeSettings>({
    queryKey: displayUsername ? 
      [`/api/users/${displayUsername}/theme`] : 
      ['/api/user/theme'],
    enabled: !!displayUsername || !!sessionData?.user,
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
  const isOwnProfile = sessionData?.user && 
                       userData && 
                       sessionData.user.username === userData.username;
  
  // Get listings for the profile
  const { data: listings = [] } = useQuery<any[]>({
    queryKey: displayUsername ? 
      [`/api/users/${displayUsername}/listings`] : 
      ['/api/listings'],
    enabled: !!displayUsername || !!sessionData?.user,
  });
  
  // Use API data, falling back to defaults when needed
  const profileData = {
    name: userData?.fullName || userData?.username || "Agent Name",
    title: userData?.title || "Real Estate Professional",
    phone: userData?.phone || "(555) 123-4567",
    email: userData?.email || "agent@example.com",
    location: userData?.location || "New York, NY",
    bio: userData?.bio || "Licensed real estate agent with over 5 years of experience in luxury properties and new developments. I specialize in helping clients find their dream homes in the most desirable neighborhoods.",
    specialties: userData?.specialties || ["Luxury Homes", "New Construction", "Investment Properties"],
    experience: userData?.experience || "5+ years",
    licenses: userData?.licenses || ["NY Real Estate License #12345"],
    profileImage: userData?.profileImage || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&h=200&q=80"
  };
  
  // Show loading state while data is being fetched
  if (loadingUserData || loadingTheme) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAuthenticated={!!sessionData?.user} />
        <div className="flex-grow flex items-center justify-center">
          <p>Loading profile information...</p>
        </div>
      </div>
    );
  }
  
  // Prepare template props
  const templateProps: ProfileTemplateProps = {
    userData: profileData,
    listings: listings,
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
    isOwnProfile: isOwnProfile
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
      <Header isAuthenticated={!!sessionData?.user} />
      
      <div className="flex-grow">
        {isOwnProfile && <EmailVerificationAlert />}
        
        {/* Render the selected template */}
        <SelectedTemplate 
          userData={profileData}
          listings={listings}
          theme={templateProps.theme}
          isOwnProfile={isOwnProfile}
        />
      </div>
    </div>
  );
}
