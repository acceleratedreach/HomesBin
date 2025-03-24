import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function EmailVerificationAlert() {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
  });

  const { mutate: sendVerificationEmail } = useMutation({
    mutationFn: async () => {
      setIsSending(true);
      await apiRequest('POST', '/api/user/verify-email/send', {});
    },
    onSuccess: () => {
      toast({
        title: "Verification email sent",
        description: "Please check your inbox to verify your email address.",
      });
      setIsSending(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive",
      });
      setIsSending(false);
    }
  });

  if (userData?.emailVerified) {
    return null;
  }

  return (
    <Alert variant="warning" className="mb-8 bg-amber-50 border-l-4 border-amber-400">
      <AlertCircle className="h-5 w-5 text-amber-400" />
      <AlertTitle className="text-amber-800">Email verification required</AlertTitle>
      <AlertDescription className="text-amber-700">
        <p>Please verify your email address to access all dashboard features. Check your spam folder if you haven't received the verification email.</p>
        <div className="mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-amber-50 text-amber-800 hover:bg-amber-100" 
            onClick={() => sendVerificationEmail()}
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Resend verification email"}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
