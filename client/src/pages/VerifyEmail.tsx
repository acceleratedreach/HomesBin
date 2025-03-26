import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function verifyEmail() {
      try {
        // Get token from URL query parameter
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        
        if (!token) {
          setError('No verification token provided.');
          setVerifying(false);
          return;
        }
        
        // Call API to verify the email
        const response = await fetch(`/api/user/verify-email?token=${token}`);
        const data = await response.json();
        
        if (response.ok) {
          setVerified(true);
          toast({
            title: 'Email verified',
            description: 'Your email has been successfully verified.',
            variant: 'default',
          });
        } else {
          setError(data.message || 'Failed to verify email. The token may be invalid or expired.');
          toast({
            title: 'Verification failed',
            description: data.message || 'Failed to verify email. The token may be invalid or expired.',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Error verifying email:', err);
        setError('An unexpected error occurred. Please try again later.');
        toast({
          title: 'Error',
          description: 'An unexpected error occurred. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setVerifying(false);
      }
    }
    
    verifyEmail();
  }, [toast]);
  
  if (verifying) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Verifying Your Email</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p>Please wait while we verify your email address...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (verified) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Email Verified</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p>Your email has been successfully verified!</p>
              <p className="text-sm text-gray-500">
                You can now access all features of your HomesBin account.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={() => navigate('/login')}
              variant="default"
            >
              Continue to Login
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
          <CardTitle className="text-center">Verification Failed</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="h-16 w-16 text-red-500" />
            <p className="text-red-500">{error || 'Failed to verify your email.'}</p>
            <p className="text-sm text-gray-500">
              The verification link may be invalid or expired. Please request a new verification link.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button 
            onClick={() => navigate('/login')}
            variant="outline"
          >
            Back to Login
          </Button>
          <Button 
            onClick={() => navigate('/settings')}
            variant="default"
          >
            Go to Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}