import { useEffect, useCallback } from "react";
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
import ProfileSetup from "./pages/ProfileSetup";
import { supabase } from "@/lib/supabase";

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

function MainAppRoutes() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useSupabaseAuth();
  
  // Log authentication state for debugging
  useEffect(() => {
    console.log('Auth state in MainAppRoutes:', { 
      isAuthenticated, 
      authLoading, 
      currentPath: location,
      user: user ? { id: user.id.substring(0, 8) + '...', email: user.email } : null
    });
  }, [isAuthenticated, authLoading, location, user]);

  // Get current user profile from Supabase directly when authenticated
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Get profile from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Get current user information (combine auth user with profile data)
  const currentUser = userData || (user ? {
    id: user.id,
    email: user.email || '',
    username: user.user_metadata?.username || user.email?.split('@')[0] || '',
    fullName: user.user_metadata?.full_name || '',
    emailVerified: user.email_confirmed_at ? true : false
  } : undefined);
  
  // Simple auth check function to centralize logic
  const redirectBasedOnAuth = useCallback(() => {
    // Don't redirect while still loading auth state
    if (authLoading) {
      console.log("Still loading auth state, delaying redirect decision");
      return;
    }
    
    console.log("Redirect check:", { 
      isAuthenticated, 
      currentPath: location,
      hasUser: !!user,
      username: currentUser?.username
    });
    
    // Root path doesn't need redirection
    if (location === '/') return;
    
    // Add some paths that should never redirect 
    if (location.startsWith('/verify-email') || 
        location.startsWith('/reset-password') ||
        location.startsWith('/forgot-password')) {
      return;
    }
    
    // Check if current path is public
    const isPublicRoute = PUBLIC_ROUTES.includes(location) || 
                          location.startsWith('/profile/') ||
                          location === '/profile';
    
    // Handle login/register pages when already authenticated
    if (isAuthenticated && (location === '/login' || location === '/register')) {
      console.log("Already authenticated, redirecting to dashboard");
      const username = currentUser?.username || user?.email?.split('@')[0] || 'user';
      navigate(`/${username}/dashboard`, { replace: true });
      return;
    }
    
    // Extract username from path for user-specific routes
    const pathParts = location.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const urlUsername = pathParts[0];
      const routeName = pathParts.length > 1 ? pathParts[1] : '';
      
      // If authenticated and viewing someone else's user-specific route, redirect to own
      if (isAuthenticated && 
          currentUser?.username && 
          urlUsername !== currentUser.username && 
          ['dashboard', 'settings', 'listings', 'email-marketing', 'social-content', 
           'listing-graphics', 'lot-maps', 'theme'].includes(routeName)) {
        console.log(`User ${currentUser.username} trying to access ${urlUsername}'s route, redirecting`);
        navigate(`/${currentUser.username}/${routeName}`, { replace: true });
        return;
      }
    }
    
    // Handle protected routes when not authenticated - BUT only if we're sure auth is not in a transitional state
    if (!isAuthenticated && !isPublicRoute && !authLoading) {
      console.log("Detected unauthenticated access to protected route:", location);
      
      // Define a function to handle recovery attempts
      const attemptSessionRecovery = async () => {
        console.log("Attempting session recovery before redirecting...");
        
        // First, check directly with Supabase API
        try {
          console.log("Direct session check with Supabase");
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.warn("Error checking session:", error.message);
          } else if (data.session) {
            console.log("Session found directly in Supabase but not in context");
            // Session exists, just missing from context - refresh page to sync
            console.log("Refreshing page to restore session context");
            
            // Set a flag to prevent infinite refresh loops
            try {
              const lastRefresh = localStorage.getItem('sb-last-refresh');
              const now = Date.now();
              
              if (lastRefresh && now - parseInt(lastRefresh) < 5000) {
                console.warn("Detected potential refresh loop, redirecting to login instead");
                localStorage.removeItem('sb-last-refresh');
                navigate('/login', { replace: true });
                return false;
              }
              
              localStorage.setItem('sb-last-refresh', now.toString());
              window.location.reload();
              return true;
            } catch (e) {
              console.error("Error handling refresh:", e);
            }
            return true;
          }
        } catch (e) {
          console.error("Exception during direct session check:", e);
        }
        
        // Second, try retrieving and using backup tokens
        try {
          console.log("Checking for backup tokens in localStorage");
          const accessToken = localStorage.getItem('sb-access-token');
          const refreshToken = localStorage.getItem('sb-refresh-token');
          
          if (accessToken && refreshToken) {
            console.log("Found tokens in localStorage, attempting recovery");
            
            try {
              // Try to restore session with the stored refresh token
              // Use refreshSession instead of setSession which isn't available in v2.49.3
              const { data, error } = await supabase.auth.refreshSession({
                refresh_token: refreshToken
              });
              
              if (error) {
                console.warn("Failed to restore session with tokens:", error.message);
              } else if (data.session) {
                console.log("Successfully restored session from tokens");
                // Refresh page to update auth context
                window.location.reload();
                return true;
              }
            } catch (tokenError) {
              console.error("Error using backup tokens:", tokenError);
            }
          }
        } catch (e) {
          console.error("Error accessing localStorage:", e);
        }
        
        // If we get here, recovery failed
        console.log("All recovery attempts failed, redirecting to login");
        return false;
      };
      
      // Execute recovery attempts and redirect if they fail
      attemptSessionRecovery().then(recovered => {
        if (!recovered) {
          // Clear any potentially invalid tokens before redirecting
          try {
            const tokensToRemove = [
              'sb-access-token', 'sb-refresh-token', 'sb-user-id', 
              'sb-session-active', 'sb-auth-timestamp'
            ];
            
            for (const key of tokensToRemove) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            console.warn("Error clearing tokens:", e);
          }
          
          navigate('/login', { replace: true });
        }
      });
      
      return;
    }
    
    // If user is authenticated, make sure they're accessing their personal routes correctly
    if (isAuthenticated && currentUser?.username) {
      // Routes that should be prefixed with username
      const userRoutes = ['/dashboard', '/settings', '/listings', '/email-marketing', 
                          '/social-content', '/listing-graphics', '/lot-maps', '/theme'];
      
      // Check if we need to add username prefix to route
      for (const route of userRoutes) {
        if (location === route) {
          const correctPath = `/${currentUser.username}${route}`;
          console.log(`Redirecting to user-specific path: ${correctPath}`);
          navigate(correctPath, { replace: true });
          return;
        }
      }
    }
  }, [isAuthenticated, authLoading, location, user, currentUser, navigate]);
  
  // Run redirect check when auth state or location changes
  useEffect(() => {
    redirectBasedOnAuth();
  }, [redirectBasedOnAuth]);

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
      
      {/* Main Dashboard - use same component for both routes */}
      <Route path="/:username/dashboard">
        {(params) => isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      <Route path="/dashboard">
        {() => isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      
      {/* Settings Routes - use same component for both routes */}
      <Route path="/:username/settings">
        {() => isAuthenticated ? <Settings /> : <Login />}
      </Route>
      <Route path="/settings">
        {() => isAuthenticated ? <Settings /> : <Login />}
      </Route>
      
      {/* Listings Routes - use same component for different paths */}
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
      
      {/* Email Marketing Routes */}
      <Route path="/:username/email-marketing">
        {() => isAuthenticated ? <EmailMarketing /> : <Login />}
      </Route>
      <Route path="/email-marketing">
        {() => isAuthenticated ? <EmailMarketing /> : <Login />}
      </Route>
      
      {/* Social Content Routes */}
      <Route path="/:username/social-content">
        {() => isAuthenticated ? <SocialContent /> : <Login />}
      </Route>
      <Route path="/social-content">
        {() => isAuthenticated ? <SocialContent /> : <Login />}
      </Route>
      
      {/* Listing Graphics Routes */}
      <Route path="/:username/listing-graphics">
        {() => isAuthenticated ? <ListingGraphics /> : <Login />}
      </Route>
      <Route path="/listing-graphics">
        {() => isAuthenticated ? <ListingGraphics /> : <Login />}
      </Route>
      
      {/* Lot Maps Routes */}
      <Route path="/:username/lot-maps">
        {() => isAuthenticated ? <LotMaps /> : <Login />}
      </Route>
      <Route path="/lot-maps">
        {() => isAuthenticated ? <LotMaps /> : <Login />}
      </Route>
      
      {/* Lot Map Editor Routes */}
      <Route path="/:username/lot-maps/:slug/editor">
        {() => isAuthenticated ? <LotMapEditor /> : <Login />}
      </Route>
      
      {/* Public Lot Map Viewer */}
      <Route path="/homesbin.com/:slug">
        {() => <PublicLotMapViewer />}
      </Route>
      
      {/* Theme Routes */}
      <Route path="/:username/theme">
        {() => isAuthenticated ? <ThemePage /> : <Login />}
      </Route>
      <Route path="/theme">
        {() => isAuthenticated ? <ThemePage /> : <Login />}
      </Route>
      
      {/* Profile Routes */}
      <Route path="/profile/:username">
        {(params) => <Profile username={params.username} />}
      </Route>
      
      <Route path="/profile">
        {() => currentUser?.username ? 
          <Profile username={currentUser.username} /> : 
          (isAuthenticated ? <Profile username="" /> : <Login />)
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
      
      {/* Profile Setup Route */}
      <Route path="/profile-setup">
        {() => isAuthenticated ? <ProfileSetup /> : <Login />}
      </Route>
      
      {/* Fallback for undefined routes */}
      <Route path="*">
        {() => <NotFound />}
      </Route>
    </Switch>
  );
}

function App() {
  // Function to handle authentication errors
  const handleAuthError = () => {
    console.log("Handling auth error - clearing local storage and redirecting");
    
    // Clear all authentication-related items in storage
    try {
      // Clear local storage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          console.log(`Removing localStorage key: ${key}`);
          localStorage.removeItem(key);
        }
      }
      
      // Clear session cookies by setting expired date
      document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'supabase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Reload the application to get a clean state
      window.location.href = '/login';
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <div className="app-container">
          <button 
            onClick={handleAuthError}
            className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded text-xs opacity-0 hover:opacity-100 z-50 transition-opacity"
            title="Reset authentication state if you're having login issues"
          >
            Reset Auth
          </button>
          <MainAppRoutes />
          <Toaster />
        </div>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
