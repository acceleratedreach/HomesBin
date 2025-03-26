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

interface UserData {
  id: number;
  username: string;
  email: string;
  emailVerified?: boolean;
  fullName?: string;
}

interface SessionData {
  user: UserData;
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
  
  // Fetch session data to determine authentication status
  const { data: sessionData, isLoading: sessionLoading, error: sessionError, refetch: refetchSession } = useQuery<SessionData>({
    queryKey: ['/api/auth/session'],
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 10000, // Refetch every 10 seconds in case session changes
  });
  
  // Force refetch on first load
  useEffect(() => {
    // Force refetch session data immediately when component mounts
    refetchSession();
    
    // Also set an interval to check auth status periodically
    const interval = setInterval(() => {
      console.log('Periodic session check');
      refetchSession();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [refetchSession]);
  
  // Add debugging logs
  useEffect(() => {
    console.log('Session data updated in App.tsx:', sessionData);
    console.log('Session loading:', sessionLoading);
    console.log('Session error:', sessionError);
    console.log('Current location:', location);
  }, [sessionData, sessionLoading, sessionError, location]);
  
  // Check if user is authenticated based on session data
  const isAuthenticated = !!sessionData?.user;
  
  // Fetch user data if authenticated
  const { data: userData, isLoading: userLoading, error: userError, refetch: refetchUser } = useQuery<UserData>({
    queryKey: ['/api/user'],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 2,
  });
  
  // Refetch user data when session changes
  useEffect(() => {
    if (isAuthenticated) {
      refetchUser();
    }
  }, [isAuthenticated, refetchUser]);
  
  // Add debugging logs for user data
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User data updated in App.tsx:', userData);
      console.log('User loading:', userLoading);
      console.log('User error:', userError);
    }
  }, [userData, userLoading, userError, isAuthenticated]);
  
  // Get current user information
  const currentUser = userData || sessionData?.user;
  
  // Handle authentication-based redirects
  useEffect(() => {
    // Don't do anything while session data is loading
    if (sessionLoading) return;
    
    // Log redirection status
    console.log('Auth check:', { 
      isAuthenticated, 
      location,
      currentUser: currentUser?.username,
      isLoading: sessionLoading || userLoading
    });
    
    // Special case: direct navigation to a user-specific URL pattern like /:username/dashboard
    const userPathMatch = location.match(/^\/([^\/]+)\/([^\/]+)/);
    if (userPathMatch) {
      const [, usernameFromPath, section] = userPathMatch;
      
      // If authenticated and the username in URL doesn't match, redirect
      if (isAuthenticated && currentUser?.username && 
          usernameFromPath !== currentUser.username) {
        // Check if the path is a valid section for redirecting
        const validSections = ['dashboard', 'settings', 'listings', 'email-marketing', 
                              'social-content', 'listing-graphics', 'lot-maps', 'theme'];
        
        if (validSections.includes(section)) {
          const correctPath = `/${currentUser.username}/${section}`;
          console.log(`URL username mismatch, redirecting from ${location} to ${correctPath}`);
          navigate(correctPath, { replace: true });
          return;
        }
      }
      
      // If an authenticated user hits a user-specific path that isn't their own,
      // and we're not already redirecting to their correct path, continue...
      // We'll handle this in the route rendering instead for better user experience
    }
    
    // Normal public/protected route logic
    const isPublicRoute = PUBLIC_ROUTES.includes(location) || 
                          location.startsWith('/verify-email') ||
                          location.startsWith('/profile/');
    
    // If trying to access login/register page while authenticated, redirect to dashboard
    if (isAuthenticated && (location === '/login' || location === '/register')) {
      const dashboardUrl = `/${currentUser?.username}/dashboard`;
      console.log(`Already authenticated, redirecting to ${dashboardUrl}`);
      navigate(dashboardUrl, { replace: true });
      return;
    }
    
    // If not authenticated and trying to access a protected route
    if (!isAuthenticated && !isPublicRoute) {
      console.log('Not authenticated, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }
    
    // Handle redirection for user-specific paths without username prefix
    // e.g. /dashboard should redirect to /:username/dashboard
    if (isAuthenticated && currentUser?.username && !location.startsWith(`/${currentUser.username}`)) {
      // List of path prefixes that should be username-specific
      const userSpecificPrefixes = ['/dashboard', '/settings', '/listings', '/email-marketing', 
                                  '/social-content', '/listing-graphics', '/lot-maps', '/theme'];
      
      // Check if current path matches any of these prefixes exactly
      const shouldRedirect = userSpecificPrefixes.some(prefix => 
        location === prefix || // Exact match
        location.startsWith(`${prefix}/`) // Prefix with additional path
      );
      
      if (shouldRedirect) {
        // Extract the path after the prefix
        const matchedPrefix = userSpecificPrefixes.find(prefix => 
          location === prefix || location.startsWith(`${prefix}/`)
        );
        
        if (matchedPrefix) {
          const restOfPath = location === matchedPrefix ? '' : location.substring(matchedPrefix.length);
          const newPath = `/${currentUser.username}${matchedPrefix}${restOfPath}`;
          console.log(`Redirecting to user-specific path: ${newPath}`);
          navigate(newPath, { replace: true });
        }
      }
    }
  }, [isAuthenticated, location, sessionLoading, userLoading, currentUser, navigate]);

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
        {() => isAuthenticated && currentUser ? 
          <Dashboard /> : 
          <Login />
        }
      </Route>
      
      {/* User Feature Routes */}
      <Route path="/:username/settings">
        {(params) => isAuthenticated ? <Settings /> : <Login />}
      </Route>
      <Route path="/settings">
        {() => isAuthenticated && currentUser ? 
          <Settings /> : 
          <Login />
        }
      </Route>
      
      <Route path="/:username/listings/new">
        {(params) => isAuthenticated ? <ListingCreate /> : <Login />}
      </Route>
      <Route path="/listings/new">
        {() => isAuthenticated && currentUser ? 
          <ListingCreate /> : 
          <Login />
        }
      </Route>
      
      <Route path="/:username/listings/:id/edit">
        {(params) => isAuthenticated ? <ListingEdit id={Number(params.id)} /> : <Login />}
      </Route>
      <Route path="/listings/:id/edit">
        {(params) => isAuthenticated && currentUser ? 
          <ListingEdit id={Number(params.id)} /> : 
          <Login />
        }
      </Route>
      
      <Route path="/:username/listings">
        {(params) => isAuthenticated ? <Listings /> : <Login />}
      </Route>
      <Route path="/listings">
        {() => isAuthenticated && currentUser ? 
          <Listings /> : 
          <Login />
        }
      </Route>
      
      <Route path="/:username/email-marketing">
        {(params) => isAuthenticated ? <EmailMarketing /> : <Login />}
      </Route>
      <Route path="/email-marketing">
        {() => isAuthenticated && currentUser ? 
          <EmailMarketing /> : 
          <Login />
        }
      </Route>
      
      <Route path="/:username/social-content">
        {(params) => isAuthenticated ? <SocialContent /> : <Login />}
      </Route>
      <Route path="/social-content">
        {() => isAuthenticated && currentUser ? 
          <SocialContent /> : 
          <Login />
        }
      </Route>
      
      <Route path="/:username/listing-graphics">
        {(params) => isAuthenticated ? <ListingGraphics /> : <Login />}
      </Route>
      <Route path="/listing-graphics">
        {() => isAuthenticated && currentUser ? 
          <ListingGraphics /> : 
          <Login />
        }
      </Route>
      
      {/* Lot Maps Routes */}
      <Route path="/:username/lot-maps">
        {(params) => isAuthenticated ? <LotMaps /> : <Login />}
      </Route>
      <Route path="/lot-maps">
        {() => isAuthenticated && currentUser ? 
          <LotMaps /> : 
          <Login />
        }
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
        {() => isAuthenticated && currentUser ? 
          <ThemePage /> : 
          <Login />
        }
      </Route>
      
      {/* Public Profile */}
      <Route path="/profile/:username">
        {(params) => <Profile username={params.username} />}
      </Route>
      
      <Route path="/profile">
        {() => isAuthenticated && currentUser ? 
          <Profile username={currentUser.username} /> : 
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
