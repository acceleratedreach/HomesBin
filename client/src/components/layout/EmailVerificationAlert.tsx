import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function EmailVerificationAlert() {
  const [isVisible, setIsVisible] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/user'],
  });

  if (isLoading || !userData || userData.emailVerified || !isVisible) {
    return null;
  }

  const handleSendVerification = async () => {
    setIsSending(true);
    try {
      const response = await apiRequest('POST', '/api/user/verify-email/send');
      
      if (response.ok) {
        toast({
          title: "Verification email sent",
          description: `We've sent a verification link to ${userData.email}. Please check your inbox.`,
          variant: "default"
        });
        // Refresh user data
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to send verification email",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Alert variant="destructive" className="relative mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Email verification required</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <div>
          Your email address ({userData.email}) is not verified. 
          Some features will be limited until you verify your email.
          <div className="mt-1 text-sm opacity-90">
            When you click the verification link, look for a plain-text URL if the button shows as "Not Safe".
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSendVerification}
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Resend verification email"}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 h-8 w-8 rounded-full"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}