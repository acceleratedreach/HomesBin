import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Form validation schema
const formSchema = z.object({
  password: z.string().min(8, {
    message: "Password must be at least 8 characters long",
  }),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  
  // Get the token from URL params
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) {
      toast({
        title: "Error",
        description: "No reset token provided. Please request a new password reset link.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest(
        'POST',
        '/api/user/reset-password',
        {
          token,
          password: values.password,
        }
      );

      if (response.ok) {
        setResetComplete(true);
        toast({
          title: "Password reset successful",
          description: "Your password has been reset. You can now log in with your new password.",
          variant: "default",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Password reset failed",
          description: data.message || "Failed to reset password. The link may be invalid or expired.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>Invalid password reset link</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-red-500 mb-4">
              No reset token provided. Please request a new password reset link.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={() => navigate('/login')}
              variant="default"
            >
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (resetComplete) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Password Reset Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-green-600 mb-4">
              Your password has been reset successfully.
            </p>
            <p className="text-center text-gray-500">
              You can now log in with your new password.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={() => navigate('/login')}
              variant="default"
            >
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Create a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your new password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Confirm your new password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => navigate('/login')}
            variant="link"
          >
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}