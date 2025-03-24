import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, XCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function EmailVerification() {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/user'],
  });

  const { mutate: sendVerificationEmail } = useMutation({
    mutationFn: async () => {
      setIsSending(true);
      await apiRequest('POST', '/api/user/verify-email/send', {});
    },
    onSuccess: () => {
      setIsSending(false);
      toast({
        title: "Verification email sent",
        description: "Please check your inbox to verify your email address.",
      });
    },
    onError: () => {
      setIsSending(false);
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center">
          <Mail className="h-5 w-5 mr-2 text-primary-600" />
          <CardTitle>Email Verification</CardTitle>
        </div>
        <CardDescription>Verify your email address to access all features</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-1">
            {userData?.emailVerified ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {userData?.emailVerified ? "Email verified" : "Email not verified"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {userData?.emailVerified
                ? "Your email has been verified."
                : `Please verify your email address (${userData?.email})`}
            </p>
          </div>
          {!userData?.emailVerified && (
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendVerificationEmail()}
                disabled={isSending}
              >
                {isSending ? "Sending..." : "Resend verification email"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
