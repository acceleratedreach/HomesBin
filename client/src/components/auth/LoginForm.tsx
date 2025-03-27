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
import { queryClient } from "@/lib/queryClient";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";

// Define the user data interface
interface UserData {
  id: string;
  username: string;
  email: string;
  emailVerified?: boolean;
}

const formSchema = z.object({
  username: z.string().min(1, "Username or email is required")
    .refine(val => val.includes('@') || val.length >= 3, {
      message: "Enter a valid email or username",
    }),
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
      
      // Determine if input is email or username
      const isEmail = values.username.includes('@');
      const email = isEmail ? values.username : `${values.username}@example.com`;
      
      // Sign in with Supabase
      const { error } = await signIn(email, values.password);
      
      if (error) {
        throw new Error(error.message || "Login failed");
      }
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/supabase/profiles'] });
      
      console.log('Login successful, redirecting to dashboard');
      
      // Wait a bit for the session to update
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get username from user metadata or email
      const username = user?.user_metadata?.username || email.split('@')[0];
      const emailVerified = !!user?.email_confirmed_at;
      
      // Redirect based on email verification status
      if (username) {
        console.log('Username available:', username);
        // Check if email is verified
        if (emailVerified) {
          // Email is verified, go to dashboard
          setLocation(`/${username}/dashboard`);
        } else {
          // Email not verified, go to settings page
          setLocation(`/${username}/settings`);
        }
      } else {
        console.error('Username not available in user data');
        // Fallback to standard dashboard route
        setLocation('/dashboard');
      }
      
      // Display success message
      toast({
        title: "Login successful",
        description: "Welcome back to HomesBin!"
      });
    } catch (error: any) {
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
