import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EmailVerificationButtonProps {
  userEmail: string;
  isVerified: boolean;
  onSuccess?: () => void;
}

export default function EmailVerificationButton({
  userEmail,
  isVerified,
  onSuccess
}: EmailVerificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendVerification = async () => {
    if (isVerified) {
      toast({
        title: "Already verified",
        description: "Your email is already verified.",
        variant: "default"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/user/verify-email/send');

      if (response.ok) {
        toast({
          title: "Verification email sent",
          description: `We've sent a verification link to ${userEmail}. Please check your inbox.`,
          variant: "default"
        });
        if (onSuccess) onSuccess();
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
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSendVerification}
      disabled={isLoading || isVerified}
      variant={isVerified ? "outline" : "default"}
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : isVerified ? (
        "Email verified"
      ) : (
        "Resend verification email"
      )}
    </Button>
  );
}