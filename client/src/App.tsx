import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
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

// Routes that are accessible without authentication
const PUBLIC_ROUTES = [
  "/", 
  "/login", 
  "/register", 
  "/verify-email", 
  "/reset-password", 
  "/forgot-password"
];

function AppRoutes() {
  const [location, setLocation] = useLocation();
  
  // Fetch session data to determine authentication status
  const { data: sessionData, isLoading: sessionLoading } = useQuery<SessionData>({
    queryKey: ['/api/auth/session'],
    retry: false,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  // Check if user is authenticated based on session data
  const isAuthenticated = !!sessionData?.user;
  
  // Fetch user data if authenticated
  const { data: userData, isLoading: userLoading } = useQuery<{
    id: number;
    username: string;
    email: string;
    emailVerified?: boolean;
    fullName?: string;
  }>({
    queryKey: ['/api/user'],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  // Simplify by not tracking loading state
  const currentUser = userData || sessionData?.user;
  
  // Log auth status for debugging
  console.log('Auth status:', { 
    isAuthenticated, 
    location,
    username: currentUser?.username || null
  });
  
  // Handle authentication-based redirects
  useEffect(() => {
    // If authenticated and on the root path, redirect to user-specific dashboard
    if (isAuthenticated && currentUser?.username && location === '/') {
      setLocation(`/${currentUser.username}/dashboard`);
      return;
    }
    
    // If not authenticated and trying to access a protected route
    const isPublicRoute = PUBLIC_ROUTES.includes(location) || 
                          // Special case for verification links
                          location.startsWith('/verify-email');
    
    if (!isAuthenticated && !isPublicRoute) {
      setLocation('/login');
    }
    
  }, [isAuthenticated, location, currentUser, setLocation]);
  
  return (
    <Switch>
      {/* Authentication Routes */}
      <Route path="/login">
        {() => isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      
      <Route path="/register">
        {() => isAuthenticated ? <Dashboard /> : <Register />}
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
      
      {/* Main Dashboard */}
      <Route path="/:username/dashboard">
        {() => isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      <Route path="/dashboard">
        {() => isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      
      {/* User Feature Routes */}
      <Route path="/:username/settings">
        {() => isAuthenticated ? <Settings /> : <Login />}
      </Route>
      <Route path="/settings">
        {() => isAuthenticated ? <Settings /> : <Login />}
      </Route>
      
      <Route path="/:username/listings/new">
        {() => isAuthenticated ? <ListingCreate /> : <Login />}
      </Route>
      <Route path="/listings/new">
        {() => isAuthenticated ? <ListingCreate /> : <Login />}
      </Route>
      
      <Route path="/:username/listings/:id/edit">
        {(params) => isAuthenticated ? <ListingEdit id={Number(params.id)} /> : <Login />}
      </Route>
      <Route path="/listings/:id/edit">
        {(params) => isAuthenticated ? <ListingEdit id={Number(params.id)} /> : <Login />}
      </Route>
      
      <Route path="/:username/listings">
        {() => isAuthenticated ? <Listings /> : <Login />}
      </Route>
      <Route path="/listings">
        {() => isAuthenticated ? <Listings /> : <Login />}
      </Route>
      
      <Route path="/:username/email-marketing">
        {() => isAuthenticated ? <EmailMarketing /> : <Login />}
      </Route>
      <Route path="/email-marketing">
        {() => isAuthenticated ? <EmailMarketing /> : <Login />}
      </Route>
      
      <Route path="/:username/social-content">
        {() => isAuthenticated ? <SocialContent /> : <Login />}
      </Route>
      <Route path="/social-content">
        {() => isAuthenticated ? <SocialContent /> : <Login />}
      </Route>
      
      <Route path="/:username/listing-graphics">
        {() => isAuthenticated ? <ListingGraphics /> : <Login />}
      </Route>
      <Route path="/listing-graphics">
        {() => isAuthenticated ? <ListingGraphics /> : <Login />}
      </Route>
      
      <Route path="/:username/lot-maps">
        {() => isAuthenticated ? <LotMaps /> : <Login />}
      </Route>
      <Route path="/lot-maps">
        {() => isAuthenticated ? <LotMaps /> : <Login />}
      </Route>
      
      <Route path="/:username/theme">
        {() => isAuthenticated ? <ThemePage /> : <Login />}
      </Route>
      <Route path="/theme">
        {() => isAuthenticated ? <ThemePage /> : <Login />}
      </Route>
      
      {/* Public Profile */}
      <Route path="/profile/:username">
        {(params) => <Profile username={params.username} />}
      </Route>
      
      <Route path="/profile">
        {() => isAuthenticated ? <Profile username={currentUser?.username} /> : <Login />}
      </Route>
      
      {/* Landing Page */}
      <Route path="/">
        {() => <LandingPage />}
      </Route>
      
      {/* Custom profile route that matches /:username but doesn't interfere with other routes */}
      <Route path="/:username">
        {(params) => {
          // Skip this route handler if the username matches any known route
          const knownRoutes = ['login', 'register', 'verify-email', 'reset-password', 
                              'forgot-password', 'dashboard', 'settings', 'listings',
                              'email-marketing', 'social-content', 'listing-graphics',
                              'lot-maps', 'theme', 'profile'];
          
          if (knownRoutes.includes(params.username)) {
            return <NotFound />;
          }
          
          return <Profile username={params.username} />;
        }}
      </Route>
      
      {/* Fallback for undefined routes */}
      <Route>
        {() => <NotFound />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
