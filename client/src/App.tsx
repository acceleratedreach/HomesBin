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
function UserProfileRoute(props: any) {
  const username = props.params?.username;
  return <Profile username={username} />;
}

// Custom routing component for user dashboard pages
function UserDashboardRoute(props: any) {
  const username = props.params?.username;
  return <Dashboard username={username} />;
}

function AuthenticatedRoutes({ isAuthenticated, currentUser }: { isAuthenticated: boolean, currentUser: any }) {
  const [location, setLocation] = useLocation();

  // Define array of public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register"];
  // Only public profile routes are allowed without auth, not dashboard routes
  const isPublicProfileRoute = location.match(/^\/[^\/]+$/) !== null; // Username route like /johndoe
  const isPublicRoute = publicRoutes.includes(location) || location === "/" || isPublicProfileRoute;
  
  // Check if this is a user's dashboard route
  const dashboardMatch = location.match(/^\/([^\/]+)\/dashboard/);
  const isDashboardRoute = dashboardMatch !== null;
  
  // If it's a dashboard route, extract the username to check ownership
  const dashboardUsername = isDashboardRoute ? dashboardMatch[1] : null;
  const isOwnDashboard = isAuthenticated && dashboardUsername === currentUser?.username;
  
  useEffect(() => {
    // Redirect to login if:
    // 1. User is not authenticated and tries to access a protected route, or
    // 2. User tries to access any dashboard route while not authenticated, or
    // 3. User tries to access someone else's dashboard
    if ((!isAuthenticated && !isPublicRoute) || 
        (isDashboardRoute && !isAuthenticated) ||
        (isDashboardRoute && isAuthenticated && !isOwnDashboard)) {
      setLocation("/login");
    }
  }, [isAuthenticated, location, isPublicRoute, isDashboardRoute, isOwnDashboard, setLocation]);

  if (isAuthenticated) {
    const username = currentUser?.username;
    
    return (
      <Switch>
        {/* Root path needs to be first to avoid wildcard routes catching it */}
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
        
        {/* Standard routes */}
        <Route path="/dashboard">
          {() => <Dashboard />}
        </Route>
        <Route path="/settings">
          {() => <Settings />}
        </Route>
        <Route path="/profile">
          {() => <Profile />}
        </Route>
        <Route path="/listings/new">
          {() => <ListingCreate />}
        </Route>
        <Route path="/listings/:id/edit">
          {(params) => <ListingEdit id={Number(params.id)} />}
        </Route>
        <Route path="/listings">
          {() => <Listings />}
        </Route>
        <Route path="/email-marketing">
          {() => <EmailMarketing />}
        </Route>
        <Route path="/social-content">
          {() => <SocialContent />}
        </Route>
        <Route path="/listing-graphics">
          {() => <ListingGraphics />}
        </Route>
        <Route path="/lot-maps">
          {() => <LotMaps />}
        </Route>
        <Route path="/theme">
          {() => <ThemePage />}
        </Route>
        
        {/* Custom user profile routes */}
        <Route path="/:username/dashboard">
          {(params) => <Dashboard username={params.username} />}
        </Route>
        <Route path="/:username">
          {(params) => <Profile username={params.username} />}
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
      
      {/* Root path must be defined before /:username to avoid being caught by the wildcard */}
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
