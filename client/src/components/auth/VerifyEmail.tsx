import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function VerifyEmail() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the token from URL params
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        
        if (!token) {
          setStatus('error');
          setMessage('No verification token provided.');
          return;
        }

        console.log('Verifying email with token:', token);

        // Call the API to verify the email
        const response = await apiRequest(
          'GET',
          `/api/user/verify-email?token=${token}`
        );

        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been successfully verified!');
          
          // Refresh user data to update emailVerified status
          queryClient.invalidateQueries({ queryKey: ['/api/user'] });
          queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
          
          toast({
            title: 'Email verified',
            description: 'Your email has been successfully verified.',
            variant: 'default',
          });
        } else {
          const data = await response.json();
          setStatus('error');
          setMessage(data.message || 'Failed to verify email. The token may be invalid or expired.');
          toast({
            title: 'Verification failed',
            description: data.message || 'Failed to verify email. The token may be invalid or expired.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again later.');
        toast({
          title: 'Error',
          description: 'An unexpected error occurred. Please try again later.',
          variant: 'destructive',
        });
      }
    };

    verifyEmail();
  }, [toast, queryClient]);

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p>{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p>{message}</p>
              <p className="text-sm text-gray-500">
                You now have full access to all features of HomesBin.
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <p>{message}</p>
              <p className="text-sm text-gray-500">
                Please request a new verification email from your settings page.
              </p>
              <div className="mt-2 text-sm text-gray-500 max-w-md">
                <p className="font-medium">Troubleshooting Tips:</p>
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li>Make sure you're using the most recent verification link</li>
                  <li>If the verification button shows as "Not Safe", try copying the plain-text URL from the email instead</li>
                  <li>Check if your email client modified the verification link</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-3">
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
          >
            Back to Home
          </Button>
          
          {status === 'success' && (
            <Button 
              onClick={() => navigate('/settings')}
              variant="default"
            >
              Go to Settings
            </Button>
          )}
          
          {status === 'error' && (
            <Button 
              onClick={() => navigate('/settings')}
              variant="default"
            >
              Go to Settings
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}