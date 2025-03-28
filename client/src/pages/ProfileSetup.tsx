import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import ProfileSetupForm from "@/components/profile/ProfileSetupForm";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";

// Define an interface for the query params we expect to receive
interface ProfileSetupParams {
  username?: string;
  fullName?: string;
  email?: string;
}

export default function ProfileSetup() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useSupabaseAuth();
  const [initialData, setInitialData] = useState<ProfileSetupParams | undefined>();
  
  // Parse query parameters if they exist
  useEffect(() => {
    // Get query params from URL
    const params = new URLSearchParams(window.location.search);
    const username = params.get('username') || undefined;
    const fullName = params.get('fullName') || undefined;
    const email = params.get('email') || undefined;
    
    // If we have query params, use them as initial data
    if (username || fullName || email) {
      setInitialData({ username, fullName, email });
    } 
    // Otherwise, if we have a user, use their data
    else if (user) {
      const username = user.user_metadata?.username || 
                       user.email?.split('@')[0] || 
                       'user'; // Fallback
      const email = user.email || 'user@example.com'; // Fallback
      
      setInitialData({
        username,
        fullName: user.user_metadata?.fullName || '',
        email
      });
    }
  }, [user]);
  
  // If not loading and not authenticated, redirect to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log("User not authenticated, redirecting to login");
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);
  
  // If still loading or no user, show loading state
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading your profile...</h2>
            <p className="text-gray-500">Please wait while we set up your profile.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex-grow py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Complete Your Profile</h1>
            <p className="text-gray-600 mt-2">
              Let's set up your profile so others can find you and see your work.
            </p>
          </div>
          
          <ProfileSetupForm 
            initialData={initialData}
            onComplete={() => {
              // Handle successful profile setup
              // We use the username from the form response in ProfileSetupForm for navigation
            }}
          />
        </div>
      </div>
    </div>
  );
} 