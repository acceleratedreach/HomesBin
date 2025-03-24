import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EmailVerificationButton from "./EmailVerificationButton";

export default function EmailVerification() {
  const queryClient = useQueryClient();
  
  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/user'],
  });

  const handleSuccess = () => {
    // Refetch user data after sending verification email
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
  };

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
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              {userData?.emailVerified ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="ml-3 flex-grow">
              <p className="text-sm font-medium text-gray-900">
                {userData?.emailVerified ? "Email verified" : "Email not verified"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {userData?.emailVerified
                  ? "Your email has been verified. You have full access to all features."
                  : `Please verify your email address (${userData?.email}) to unlock all features.`}
              </p>
            </div>
          </div>

          {!userData?.emailVerified && (
            <div className="mt-3">
              <EmailVerificationButton 
                userEmail={userData?.email || ''} 
                isVerified={userData?.emailVerified || false}
                onSuccess={handleSuccess}
              />
              <p className="text-xs text-gray-500 mt-2">
                If you don't see the email in your inbox, please check your spam folder.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
