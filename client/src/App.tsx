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
import LotMapEditor from "@/pages/lotmap/LotMapEditor";
import PublicLotMapViewer from "@/pages/lotmap/PublicLotMapViewer";
import VerifyEmail from "@/components/auth/VerifyEmail";
import ResetPassword from "@/components/auth/ResetPassword";
import ForgotPassword from "@/components/auth/ForgotPassword";
import { useQuery } from "@tanstack/react-query";
import { getToken } from "./lib/authUtils";

interface UserData {
  id: number;
  username: string;
  email: string;
  emailVerified?: boolean;
  fullName?: string;
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
  const [location, navigate] = useLocation();
  
  // Simplified authentication check based only on token
  const token = getToken();
  const isAuthenticated = !!token;
  
  // Get user data directly from /api/auth/user endpoint
  const { data: userData, isLoading: userLoading } = useQuery<UserData>({
    queryKey: ['/api/auth/user'],
    enabled: isAuthenticated,
    retry: 1,
    retryDelay: 1000,
  });
  
  // Simple redirect logic
  useEffect(() => {
    // Basic debug info
    console.log('Auth state:', { 
      hasToken: !!token, 
      isAuthenticated,
      userData: userData || null,
      location 
    });
    
    // Handle login/register pages
    if (isAuthenticated && (location === '/login' || location === '/register')) {
      const dashboardPath = '/dashboard';
      navigate(dashboardPath, { replace: true });
      return;
    }
    
    // Simple public/protected route logic
    const isPublicRoute = PUBLIC_ROUTES.includes(location) || 
                          location.startsWith('/verify-email') ||
                          location.startsWith('/profile/');
    
    // Redirect to login if not authenticated and trying to access protected route
    if (!isAuthenticated && !isPublicRoute) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, location, userData, navigate]);

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
        {(params) => isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      <Route path="/dashboard">
        {() => isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      
      {/* User Feature Routes */}
      <Route path="/:username/settings">
        {(params) => isAuthenticated ? <Settings /> : <Login />}
      </Route>
      <Route path="/settings">
        {() => isAuthenticated ? <Settings /> : <Login />}
      </Route>
      
      <Route path="/:username/listings/new">
        {(params) => isAuthenticated ? <ListingCreate /> : <Login />}
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
        {(params) => isAuthenticated ? <Listings /> : <Login />}
      </Route>
      <Route path="/listings">
        {() => isAuthenticated ? <Listings /> : <Login />}
      </Route>
      
      <Route path="/:username/email-marketing">
        {(params) => isAuthenticated ? <EmailMarketing /> : <Login />}
      </Route>
      <Route path="/email-marketing">
        {() => isAuthenticated ? <EmailMarketing /> : <Login />}
      </Route>
      
      <Route path="/:username/social-content">
        {(params) => isAuthenticated ? <SocialContent /> : <Login />}
      </Route>
      <Route path="/social-content">
        {() => isAuthenticated ? <SocialContent /> : <Login />}
      </Route>
      
      <Route path="/:username/listing-graphics">
        {(params) => isAuthenticated ? <ListingGraphics /> : <Login />}
      </Route>
      <Route path="/listing-graphics">
        {() => isAuthenticated ? <ListingGraphics /> : <Login />}
      </Route>
      
      {/* Lot Maps Routes */}
      <Route path="/:username/lot-maps">
        {(params) => isAuthenticated ? <LotMaps /> : <Login />}
      </Route>
      <Route path="/lot-maps">
        {() => isAuthenticated ? <LotMaps /> : <Login />}
      </Route>
      
      {/* Lot Map Editor Routes */}
      <Route path="/:username/lot-maps/:slug/editor">
        {(params) => isAuthenticated ? <LotMapEditor /> : <Login />}
      </Route>
      
      {/* Public Lot Map Viewer */}
      <Route path="/homesbin.com/:slug">
        {(params) => <PublicLotMapViewer />}
      </Route>
      
      <Route path="/:username/theme">
        {(params) => isAuthenticated ? <ThemePage /> : <Login />}
      </Route>
      <Route path="/theme">
        {() => isAuthenticated ? <ThemePage /> : <Login />}
      </Route>
      
      {/* Public Profile */}
      <Route path="/profile/:username">
        {(params) => <Profile username={params.username} />}
      </Route>
      
      <Route path="/profile">
        {() => isAuthenticated && userData ? 
          <Profile username={userData.username} /> : 
          <Login />
        }
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
