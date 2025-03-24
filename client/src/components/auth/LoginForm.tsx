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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

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
      const response = await apiRequest('POST', '/api/auth/login', values);
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      
      // Redirect to user-specific dashboard
      if (response && typeof response === 'object' && 'user' in response && 
          response.user && typeof response.user === 'object' && 
          'username' in response.user && response.user.username) {
        console.log('Login successful, redirecting to:', `/${response.user.username}/dashboard`);
        setLocation(`/${response.user.username}/dashboard`);
      } else {
        // Fallback - query for session data directly
        try {
          const sessionData = await queryClient.fetchQuery({ 
            queryKey: ['/api/auth/session']
          });
          
          if (sessionData && typeof sessionData === 'object' && 'user' in sessionData && 
              sessionData.user && typeof sessionData.user === 'object' && 
              'username' in sessionData.user && sessionData.user.username) {
            console.log('Login successful (from session), redirecting to:', `/${sessionData.user.username}/dashboard`);
            setLocation(`/${sessionData.user.username}/dashboard`);
          } else {
            console.error('Login issue: Session data missing username', sessionData);
            toast({
              title: "Login issue",
              description: "Logged in successfully but couldn't determine username.",
              variant: "destructive",
            });
          }
        } catch (sessionError) {
          console.error('Error fetching session after login:', sessionError);
          toast({
            title: "Login issue",
            description: "Logged in but couldn't retrieve your account details.",
            variant: "destructive",
          });
        }
      }
      
      toast({
        title: "Login successful",
        description: "Welcome back to HomesBin!",
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
                    <Link href="/forgot-password">
                      <a className="text-sm text-primary-600 hover:text-primary-500">
                        Forgot password?
                      </a>
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
          <Link href="/register">
            <a className="text-primary underline-offset-4 hover:underline">
              Register
            </a>
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
