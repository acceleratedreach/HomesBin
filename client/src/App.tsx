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
import { SupabaseAuthProvider, useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { useQuery } from "@tanstack/react-query";

interface UserData {
  id: string;
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
  const { user, isAuthenticated, loading: authLoading } = useSupabaseAuth();
  
  // Fetch additional user profile data from Supabase if authenticated
  const { data: userData, isLoading: userLoading } = useQuery<UserData>({
    queryKey: ['/api/supabase/profiles', user?.id],
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  // Get current user information (combine auth user with profile data)
  const currentUser = userData || (user ? {
    id: user.id,
    email: user.email || '',
    username: user.user_metadata?.username || user.email?.split('@')[0] || '',
    fullName: user.user_metadata?.full_name || '',
    emailVerified: user.email_confirmed_at ? true : false
  } : undefined);
  
  // Handle authentication-based redirects
  useEffect(() => {
    // Don't redirect from root path - allow users to see landing page even when authenticated
    if (location === '/') return;
    
    // If loading, wait for data before making routing decisions
    if (authLoading) return;
    
    // Check if trying to access a public route
    const isPublicRoute = PUBLIC_ROUTES.includes(location) || 
                          location.startsWith('/verify-email') ||
                          location.startsWith('/profile/');
    
    // If not authenticated and trying to access a protected route
    if (!isAuthenticated && !isPublicRoute) {
      navigate('/login', { replace: true });
      return;
    }
    
    // If authenticated but accessing a non-username route, redirect to the username-specific route
    if (isAuthenticated && currentUser?.username && !authLoading && !userLoading) {
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
          navigate(`/${currentUser.username}${matchedPrefix}${restOfPath}`, { replace: true });
        }
      }
    }
  }, [isAuthenticated, location, authLoading, userLoading, currentUser, navigate]);

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
      <SupabaseAuthProvider>
        <AppRoutes />
        <Toaster />
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
