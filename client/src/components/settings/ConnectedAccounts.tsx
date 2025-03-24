import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { SocialAccount } from "@shared/schema";

// Social media platform icons
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const socialPlatforms: SocialPlatform[] = [
  {
    id: "facebook",
    name: "Facebook",
    icon: <Facebook className="h-5 w-5" />,
    color: "text-blue-600",
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: <Twitter className="h-5 w-5" />,
    color: "text-blue-400",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <Instagram className="h-5 w-5" />,
    color: "text-pink-600",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: <Linkedin className="h-5 w-5" />,
    color: "text-blue-700",
  },
];

export default function ConnectedAccounts() {
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: socialAccounts, isLoading } = useQuery({
    queryKey: ['/api/social-accounts'],
  });

  const { mutate: connectAccount } = useMutation({
    mutationFn: async (platform: string) => {
      setIsConnecting(platform);
      // In a real implementation, this would redirect to OAuth flow
      // For now, we'll mock the connection
      await apiRequest('POST', '/api/social-accounts', {
        platform,
        accountId: `${platform}_${Math.random().toString(36).substring(7)}`,
        accountUsername: `user_${platform}`,
        accessToken: `token_${Math.random().toString(36).substring(7)}`,
      });
    },
    onSuccess: () => {
      setIsConnecting(null);
      queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] });
      toast({
        title: "Account connected",
        description: "Your social account has been connected successfully.",
      });
    },
    onError: () => {
      setIsConnecting(null);
      toast({
        title: "Error",
        description: "Failed to connect social account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { mutate: disconnectAccount } = useMutation({
    mutationFn: async (accountId: number) => {
      setIsDisconnecting(accountId);
      await apiRequest('DELETE', `/api/social-accounts/${accountId}`, {});
    },
    onSuccess: () => {
      setIsDisconnecting(null);
      queryClient.invalidateQueries({ queryKey: ['/api/social-accounts'] });
      toast({
        title: "Account disconnected",
        description: "Your social account has been disconnected successfully.",
      });
    },
    onError: () => {
      setIsDisconnecting(null);
      toast({
        title: "Error",
        description: "Failed to disconnect social account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isAccountConnected = (platform: string) => {
    return socialAccounts?.some((account: SocialAccount) => account.platform === platform);
  };

  const getConnectedAccount = (platform: string) => {
    return socialAccounts?.find((account: SocialAccount) => account.platform === platform);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>Manage your connected social accounts for sharing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {socialPlatforms.map((platform) => {
          const isConnected = isAccountConnected(platform.id);
          const connectedAccount = getConnectedAccount(platform.id);

          return (
            <div key={platform.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`bg-${platform.id === 'facebook' ? 'blue' : platform.id === 'twitter' ? 'blue' : platform.id === 'instagram' ? 'pink' : 'blue'}-100 p-2 rounded-full`}>
                  <div className={platform.color}>{platform.icon}</div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">{platform.name}</h4>
                  <p className="text-xs text-gray-500">
                    {isConnected
                      ? <span className="text-green-600">Connected as @{connectedAccount?.accountUsername}</span>
                      : "Not connected"}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (isConnected && connectedAccount) {
                    disconnectAccount(connectedAccount.id);
                  } else {
                    connectAccount(platform.id);
                  }
                }}
                disabled={isConnecting === platform.id || (isConnected && isDisconnecting === connectedAccount?.id)}
              >
                {isConnecting === platform.id || (isConnected && isDisconnecting === connectedAccount?.id)
                  ? "Loading..."
                  : isConnected
                  ? "Disconnect"
                  : "Connect"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
