import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { SupabaseAuthProvider, useSupabaseAuth } from "@/context/SupabaseAuthSimplified";
import LoginFormSimplified from "@/components/auth/LoginFormSimplified";

// Simple Dashboard component for testing
const Dashboard = () => {
  const { user, signOut } = useSupabaseAuth();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      
      {user ? (
        <div className="space-y-4">
          <p>Welcome, {user.email}</p>
          <p>User ID: {user.id}</p>
          
          <button 
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <p>Not signed in</p>
      )}
    </div>
  );
};

// Main Routes
function AppRoutes() {
  const [location] = useLocation();
  const { isAuthenticated, loading, user } = useSupabaseAuth();
  
  // Log auth state for debugging
  useEffect(() => {
    console.log('Auth state:', { 
      isAuthenticated, 
      loading,
      location,
      user: user ? { id: user.id.slice(0, 6) + '...', email: user.email } : null 
    });
  }, [isAuthenticated, loading, location, user]);

  return (
    <Switch>
      <Route path="/login">
        {() => isAuthenticated ? <Dashboard /> : <LoginFormSimplified />}
      </Route>
      
      <Route path="/dashboard">
        {() => isAuthenticated ? <Dashboard /> : <LoginFormSimplified />}
      </Route>
      
      <Route path="/">
        {() => isAuthenticated ? <Dashboard /> : <LoginFormSimplified />}
      </Route>
    </Switch>
  );
}

// Main App with Providers
export default function TestApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <div className="flex flex-col min-h-[100dvh]">
          <header className="p-4 bg-primary text-white">
            <h1 className="text-xl font-bold">HomesBin Test App</h1>
          </header>
          
          <main className="flex-1 p-4">
            <AppRoutes />
          </main>
          
          <footer className="p-4 bg-gray-100 text-center text-gray-600">
            <p>© 2025 HomesBin</p>
          </footer>
        </div>
        
        <Toaster />
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}