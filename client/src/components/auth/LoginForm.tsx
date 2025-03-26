import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { apiRequest, checkAuthentication } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { setToken } from "@/lib/authUtils";

// Define the user data interface
interface UserData {
  id: number;
  username: string;
  email: string;
  emailVerified?: boolean;
}

const formSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      // Send login request to API
      console.log('Submitting login request with values:', values);
      const loginResponse = await apiRequest('POST', '/api/auth/login', values);
      console.log('Login API response:', loginResponse);
      
      // Directly save the token ourselves to ensure it gets stored
      if (loginResponse.token) {
        console.log('Manually storing token from login response, length:', loginResponse.token.length);
        setToken(loginResponse.token);
        
        // Verify token was stored
        const storedToken = localStorage.getItem('auth_token');
        console.log('Verified token in localStorage after setting:', storedToken ? 'Yes (length: ' + storedToken.length + ')' : 'No');
      } else {
        console.error('No token in login response!');
      }
      
      // Show success message immediately
      toast({
        title: "Login successful",
        description: "Redirecting to dashboard..."
      });
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries();
      
      // Wait a moment to ensure token is stored
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Confirm authentication status
      const isAuthenticated = await checkAuthentication();
      console.log('Authentication check after login:', isAuthenticated);
      
      // Simple approach: direct browser navigation with full page reload
      if (loginResponse?.user?.username) {
        const username = loginResponse.user.username;
        console.log('Login successful, username:', username);
        
        try {
          // First try a standard redirect
          const dashboardUrl = `/${username}/dashboard`;
          console.log('Redirecting to:', dashboardUrl);
          
          // Let's check if we have the token in local storage
          const storedToken = localStorage.getItem('auth_token');
          console.log('Token in localStorage before redirect:', storedToken ? 'Yes (length: ' + storedToken.length + ')' : 'No');
          
          // Use window.location for a more reliable redirect with a fresh state
          window.location.href = dashboardUrl;
        } catch (navError) {
          console.error('Navigation error:', navError);
          // Fallback to a direct href change in case replace fails
          window.location.href = `/${username}/dashboard`;
        }
      } else {
        console.error('Missing user information in login response');
        throw new Error('Invalid login response');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Log in to HomesBin</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username or Email</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe or john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-500">
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log in"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary underline-offset-4 hover:underline">
            Register
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
