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
import VerifyEmail from "@/components/auth/VerifyEmail";
import ResetPassword from "@/components/auth/ResetPassword";
import ForgotPassword from "@/components/auth/ForgotPassword";
import { useQuery } from "@tanstack/react-query";

function AuthenticatedRoutes({ isAuthenticated, currentUser }: { isAuthenticated: boolean, currentUser: any }) {
  const [location, setLocation] = useLocation();

  // Define array of public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register", "/verify-email", "/reset-password", "/forgot-password"];
  
  // Public profile routes are allowed without auth
  const profileMatch = location.match(/^\/([^\/]+)$/); // Matches /username (profiles)
  const isPublicProfileRoute = profileMatch !== null;
  
  const isPublicRoute = publicRoutes.includes(location) || location === "/" || isPublicProfileRoute;
  
  // Check if this is a user's dashboard or feature route
  const routeMatch = location.match(/^\/([^\/]+)\/(.+)/); // Matches /username/anything
  const isUserFeatureRoute = routeMatch !== null;
  
  // If it's a user feature route, extract the username to check ownership
  const routeUsername = isUserFeatureRoute ? routeMatch[1] : 
                       isPublicProfileRoute ? profileMatch![1] : null;
  const isOwnRoute = isAuthenticated && routeUsername === currentUser?.username;
  
  // Check if this is the settings page (special case) 
  // Settings and Profile pages are accessible even for unverified users
  const isSettingsPage = isUserFeatureRoute && routeMatch[2] === 'settings';
  const isProfilePage = isPublicProfileRoute;
  
  useEffect(() => {
    // Extract the feature if we're on a user feature route
    const featurePath = isUserFeatureRoute ? routeMatch[2] : null;
    
    // Special handling for settings page - always allow access if authenticated
    const isSettingsAccess = featurePath === 'settings';
    
    // Redirect to login if:
    // 1. User is not authenticated and tries to access a protected route, or
    // 2. User tries to access a user-specific route (/username/...) while not authenticated, or
    // 3. User tries to access someone else's routes (except settings)
    if ((!isAuthenticated && !isPublicRoute) || 
        (isUserFeatureRoute && !isAuthenticated) ||
        (isUserFeatureRoute && isAuthenticated && !isOwnRoute && !isSettingsAccess)) {
      console.log('Redirecting to login because: path requires authentication');
      setLocation("/login");
    }
  }, [isAuthenticated, location, isPublicRoute, isUserFeatureRoute, isOwnRoute, routeMatch, setLocation]);

  if (isAuthenticated) {
    const username = currentUser?.username;
    
    return (
      <Switch>
        {/* Root path redirects to user dashboard */}
        <Route path="/">
          {() => {
            if (username) {
              setLocation(`/${username}/dashboard`);
            } else {
              return <NotFound />;
            }
            return null;
          }}
        </Route>
        
        {/* User profile routes */}
        <Route path="/:username">
          {(params) => <Profile username={params.username} />}
        </Route>
        
        {/* User-specific feature routes */}
        <Route path="/:username/dashboard">
          {(params) => <Dashboard username={params.username} />}
        </Route>
        
        <Route path="/:username/settings">
          {(params) => <Settings />}
        </Route>
        
        <Route path="/:username/listings/new">
          {(params) => <ListingCreate />}
        </Route>
        
        <Route path="/:username/listings/:id/edit">
          {(params) => <ListingEdit id={Number(params.id)} />}
        </Route>
        
        <Route path="/:username/listings">
          {(params) => <Listings />}
        </Route>
        
        <Route path="/:username/email-marketing">
          {(params) => <EmailMarketing />}
        </Route>
        
        <Route path="/:username/social-content">
          {(params) => <SocialContent />}
        </Route>
        
        <Route path="/:username/listing-graphics">
          {(params) => <ListingGraphics />}
        </Route>
        
        <Route path="/:username/lot-maps">
          {(params) => <LotMaps />}
        </Route>
        
        <Route path="/:username/theme">
          {(params) => <ThemePage />}
        </Route>
        
        {/* Auth-specific routes */}
        <Route path="/verify-email">
          {() => <VerifyEmail />}
        </Route>
        
        <Route path="/reset-password">
          {() => <ResetPassword />}
        </Route>
        
        <Route path="/forgot-password">
          {() => <ForgotPassword />}
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {() => <Login />}
      </Route>
      
      <Route path="/register">
        {() => <Register />}
      </Route>
      
      <Route path="/verify-email">
        {() => <VerifyEmail />}
      </Route>
      
      <Route path="/reset-password">
        {() => <ResetPassword />}
      </Route>
      
      <Route path="/forgot-password">
        {() => <ForgotPassword />}
      </Route>
      
      {/* Root path - landing page for unauthenticated users */}
      <Route path="/">
        {() => <LandingPage />}
      </Route>
      
      {/* Public profile routes for non-authenticated users */}
      <Route path="/:username">
        {(params) => <Profile username={params.username} />}
      </Route>
      
      <Route>
        {() => <Login />}
      </Route>
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
