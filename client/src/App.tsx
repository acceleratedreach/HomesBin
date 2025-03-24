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

interface SessionData {
  user: {
    username: string;
    email: string;
    emailVerified: boolean;
    fullName?: string;
  };
}

function AuthenticatedRoutes({ isAuthenticated, currentUser, isLoading = false }: { isAuthenticated: boolean, currentUser: any, isLoading?: boolean }) {
  const [location, setLocation] = useLocation();

  // Define array of public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register", "/verify-email", "/reset-password", "/forgot-password"];
  // Make sure /dashboard is not treated as a valid route
  
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
  
  // For debugging route ownership                     
  console.log('Auth route debug:', {
    currentUser: currentUser ? 
      `${currentUser.username} (${currentUser.id})` : 'undefined',
    routeUsername,
    isAuthenticated,
    isUserFeatureRoute,
    location
  });
  
  const isOwnRoute = isAuthenticated && 
                     routeUsername !== null && 
                     currentUser && 
                     'username' in currentUser && 
                     typeof currentUser.username === 'string' &&
                     routeUsername === currentUser.username;
  
  // Check if this is the settings page or profile page (special cases) 
  const isSettingsPage = isUserFeatureRoute && routeMatch?.[2] === 'settings';
  const isProfilePage = isPublicProfileRoute;
  
  useEffect(() => {
    // Don't do anything if loading is still in progress or we're already on login page
    if (isLoading || location === '/login') return;
  
    // Extract the feature if we're on a user feature route
    const featurePath = isUserFeatureRoute ? routeMatch[2] : null;
    
    // Special handling for settings page and public profiles
    const isSettingsAccess = featurePath === 'settings';
    const isViewingPublicProfile = isPublicProfileRoute && !isUserFeatureRoute;
    
    // If authenticated and at root, go to user dashboard
    if (isAuthenticated && location === '/' && currentUser && currentUser.username) {
      console.log('Redirecting to user dashboard from root');
      setLocation(`/${currentUser.username}/dashboard`);
      return;
    }
    
    // If authenticated and at /dashboard, go to user dashboard
    if (isAuthenticated && location === '/dashboard' && currentUser && currentUser.username) {
      console.log('Redirecting to user dashboard from /dashboard');
      setLocation(`/${currentUser.username}/dashboard`);
      return;
    }
    
    // Determine if user is trying to access someone else's dashboard
    const isAccessingOtherUserDashboard = isUserFeatureRoute && 
                                         isAuthenticated && 
                                         !isOwnRoute && 
                                         !isSettingsAccess;
    
    // Allow settings access if authenticated, regardless of email verification
    const canAccessSettings = isSettingsAccess && isAuthenticated && isOwnRoute;

    // Debug access conditions
    console.log('Access control debug:', {
      isAuthenticated,
      isPublicRoute,
      isUserFeatureRoute,
      isOwnRoute,
      isViewingPublicProfile,
      isAccessingOtherUserDashboard,
      canAccessSettings
    });
    
    // Special case: If we're authenticated and accessing route that matches username, no redirect
    if (isAuthenticated && isUserFeatureRoute && 
        currentUser && currentUser.username && routeUsername === currentUser.username) {
      console.log('Accessing own route, no redirect needed');
      return;
    }
    
    // Now handle redirects to login:
    
    // 1. User is not authenticated and tries to access a protected route (except settings)
    if (!isAuthenticated && !isPublicRoute && !canAccessSettings) {
      console.log('Redirecting to login: not authenticated for protected route');
      setLocation("/login");
      return;
    }
    
    // 2. User tries to access a user-specific feature route (/username/...) while not authenticated
    if (isUserFeatureRoute && !isAuthenticated && !canAccessSettings) {
      console.log('Redirecting to login: not authenticated for user feature route');
      setLocation("/login");
      return;
    }
    
    // 3. User tries to access someone else's dashboard routes (except public profiles)
    if (isAccessingOtherUserDashboard) {
      console.log('Redirecting to login: accessing another user\'s dashboard');
      setLocation("/login");
      return;
    }
  }, [isAuthenticated, location, isPublicRoute, isUserFeatureRoute, isOwnRoute, routeMatch, setLocation, isLoading, currentUser]);

  if (isAuthenticated) {
    const username = currentUser?.username;
    
    // If we're already at a user feature route, don't apply redirects
    if (isUserFeatureRoute && routeUsername === username) {
      console.log('Already at the correct user route:', location);
      
      return (
        <Switch>
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
          
          <Route component={NotFound} />
        </Switch>
      );
    }
    
    return (
      <Switch>
        {/* Root path redirects to user dashboard */}
        <Route path="/">
          {() => {
            if (username) {
              setLocation(`/${username}/dashboard`);
              return <div className="p-4">Redirecting to dashboard...</div>;
            } else {
              return <NotFound />;
            }
          }}
        </Route>
        
        {/* Redirect /dashboard to user-specific dashboard */}
        <Route path="/dashboard">
          {() => {
            if (username) {
              setLocation(`/${username}/dashboard`);
              return <div className="p-4">Redirecting to dashboard...</div>;
            } else {
              return <NotFound />;
            }
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
      
      {/* Redirect attempts to access /dashboard when not logged in */}
      <Route path="/dashboard">
        {() => {
          setLocation("/login");
          return null;
        }}
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
  const { data: sessionData, isLoading: sessionLoading } = useQuery<SessionData>({ 
    queryKey: ['/api/auth/session'],
    retry: false,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  const isAuthenticated = sessionData && 
    typeof sessionData === 'object' && 
    'user' in sessionData && 
    sessionData.user ? true : false;
    
  // For debugging authentication state
  console.log('Auth status:', isAuthenticated, 
    sessionData ? 'Session data exists' : 'No session data');
  
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
          isLoading={isLoading}
          currentUser={userData || (sessionData?.user as any)} 
        />
      )}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
