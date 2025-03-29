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
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/context/SupabaseAuthContextNew";
import { supabase } from "@/lib/supabase-new";

// Define the user data interface
interface UserData {
  id: string;
  username: string;
  email: string;
  emailVerified?: boolean;
}

// Define profile type for Supabase to fix type issues
interface ProfileData {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

const formSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { signIn, user } = useSupabaseAuth();

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
      
      // Add debug info
      console.log('Login submission started:', { 
        isEmail: values.username.includes('@'),
        usernameLength: values.username.length
      });
      
      // Direct login with email if it looks like an email
      let email = values.username;
      
      // If the username doesn't look like an email, try to fetch the email from profiles
      if (!values.username.includes('@')) {
        try {
          console.log('Looking up email for username:', values.username);
          
          // Query Supabase directly instead of going through the API
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', values.username)
            .limit(1);
          
          if (profileError) {
            throw profileError;
          }
          
          if (profiles && profiles.length > 0 && profiles[0].email) {
            // Use proper type casting
            const profile = profiles[0] as { email: string };
            email = profile.email;
            console.log('Found email for username:', email);
          } else {
            throw new Error("Username not found. Please try using your email instead.");
          }
        } catch (lookupError: any) {
          console.error('Error looking up user:', lookupError);
          toast({
            title: "Login failed",
            description: "Username not found. Please try using your email address directly.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Now we have the email, proceed with sign in
      console.log('Attempting login with email:', email.substring(0, 3) + '***@***');
      
      try {
        // Sign in through Supabase directly
        const signInResult = await signIn(email, values.password);
        
        // Check for error in response
        if (signInResult.error) {
          console.error('Error returned from signIn function:', signInResult.error);
          throw new Error(signInResult.error.message || "Login failed. Please check your credentials.");
        }
        
        console.log('Sign in function completed successfully');
        
        // Show success message
        toast({
          title: "Login successful",
          description: "Redirecting to dashboard..."
        });
        
        // Add a delay to ensure the session is properly established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Construct the redirection URL with the username
        const authUser = signInResult.data?.user;
        const username = authUser?.user_metadata?.username || authUser?.email?.split('@')[0] || 'dashboard';
        const redirectUrl = `/${username}/dashboard`;
        
        // Use window.location for a full page refresh with the proper URL
        window.location.href = redirectUrl;
      } catch (signInError: any) {
        console.error('Login error during sign in:', signInError);
        toast({
          title: "Login failed",
          description: signInError.message || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
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