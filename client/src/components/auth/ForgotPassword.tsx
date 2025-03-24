import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Form validation schema
const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
});

export default function ForgotPassword() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const response = await apiRequest(
        'POST',
        '/api/user/forgot-password',
        {
          email: values.email,
        }
      );

      if (response.ok) {
        setRequestSent(true);
        setUserEmail(values.email);
        toast({
          title: "Reset link sent",
          description: "If your email exists in our system, you will receive a password reset link.",
          variant: "default",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Request failed",
          description: data.message || "Failed to send password reset email. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error requesting password reset:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (requestSent) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Check Your Email</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p>
                If your email exists in our system, we've sent a password reset link to <strong>{userEmail}</strong>.
              </p>
              <p className="text-sm text-gray-500">
                Please check your inbox (and spam folder) for the reset link. The link will expire in 1 hour.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button 
              onClick={() => {
                setRequestSent(false);
                form.reset();
              }}
              variant="outline"
            >
              Send Again
            </Button>
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

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Enter your email address to receive a password reset link</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter your email address" 
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
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
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