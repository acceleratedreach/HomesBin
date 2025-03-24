import { useState, useEffect } from "react";
import { Switch, Route, useLocation, useRoute, Router, useParams } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Listings from "@/pages/Listings";
import ListingCreate from "@/pages/ListingCreate";
import ListingEdit from "@/pages/ListingEdit";
import EmailMarketing from "@/pages/EmailMarketing";
import SocialContent from "@/pages/SocialContent";
import ListingGraphics from "@/pages/ListingGraphics";
import LotMaps from "@/pages/LotMaps";
import ThemePage from "@/pages/ThemePage";
import { useQuery } from "@tanstack/react-query";

// Custom routing component for user profile pages
function UserProfileRoute() {
  const params = useParams();
  const username = params.username;
  
  return <Profile username={username} />;
}

// Custom routing component for user dashboard pages
function UserDashboardRoute() {
  const params = useParams();
  const username = params.username;
  
  return <Dashboard username={username} />;
}

function AuthenticatedRoutes({ isAuthenticated, currentUser }: { isAuthenticated: boolean, currentUser: any }) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated && !location.startsWith("/login") && !location.startsWith("/register")) {
      setLocation("/login");
    }
  }, [isAuthenticated, location, setLocation]);

  if (isAuthenticated) {
    const username = currentUser?.username;
    
    return (
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/settings" component={Settings} />
        <Route path="/profile" component={Profile} />
        <Route path="/listings" component={Listings} />
        <Route path="/listings/new" component={ListingCreate} />
        <Route path="/listings/:id/edit" component={ListingEdit} />
        <Route path="/email-marketing" component={EmailMarketing} />
        <Route path="/social-content" component={SocialContent} />
        <Route path="/listing-graphics" component={ListingGraphics} />
        <Route path="/lot-maps" component={LotMaps} />
        <Route path="/theme" component={ThemePage} />
        
        {/* Custom user profile routes */}
        <Route path="/:username/dashboard" component={UserDashboardRoute} />
        <Route path="/:username" component={UserProfileRoute} />
        
        {/* Redirect root to the user's dashboard if logged in */}
        <Route path="/">
          {() => {
            // If we have a username, redirect to the user dashboard
            if (username) {
              setLocation(`/${username}/dashboard`);
            } else {
              return <Dashboard />;
            }
            return null;
          }}
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Public profile routes for non-authenticated users */}
      <Route path="/:username" component={UserProfileRoute} />
      
      <Route path="/" component={LandingPage} />
      <Route component={Login} />
    </Switch>
  );
}

function App() {
  const { data: sessionData, isLoading: sessionLoading } = useQuery({ 
    queryKey: ['/api/auth/session'],
    retry: false,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  const isAuthenticated = sessionData && sessionData.user ? true : false;
  
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/user'],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  const isLoading = sessionLoading || (isAuthenticated && userLoading);

  return (
    <QueryClientProvider client={queryClient}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-primary-600 animate-pulse">Loading...</div>
        </div>
      ) : (
        <AuthenticatedRoutes 
          isAuthenticated={isAuthenticated} 
          currentUser={userData || (sessionData?.user as any)} 
        />
      )}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
