import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState({
    newLeadNotifications: false,
    listingUpdates: false,
    marketingEmails: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['/api/notification-preferences'],
    onSuccess: (data) => {
      if (data) {
        setPreferences({
          newLeadNotifications: data.newLeadNotifications,
          listingUpdates: data.listingUpdates,
          marketingEmails: data.marketingEmails,
        });
      }
    },
  });

  const { mutate: updatePreferences } = useMutation({
    mutationFn: async () => {
      setIsSubmitting(true);
      await apiRequest('PATCH', '/api/notification-preferences', preferences);
    },
    onSuccess: () => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['/api/notification-preferences'] });
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been updated successfully.",
      });
    },
    onError: () => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Failed to update notification preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage your notification settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start">
          <Checkbox
            id="email_new_lead"
            checked={preferences.newLeadNotifications}
            onCheckedChange={(checked) =>
              setPreferences((prev) => ({
                ...prev,
                newLeadNotifications: checked === true,
              }))
            }
          />
          <div className="ml-3 text-sm">
            <Label htmlFor="email_new_lead" className="font-medium text-gray-700">
              New lead notifications
            </Label>
            <p className="text-gray-500">
              Receive an email when a new lead is generated from your listings
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <Checkbox
            id="email_listing_updates"
            checked={preferences.listingUpdates}
            onCheckedChange={(checked) =>
              setPreferences((prev) => ({
                ...prev,
                listingUpdates: checked === true,
              }))
            }
          />
          <div className="ml-3 text-sm">
            <Label htmlFor="email_listing_updates" className="font-medium text-gray-700">
              Listing updates
            </Label>
            <p className="text-gray-500">
              Receive notifications about your listing performance
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <Checkbox
            id="email_marketing"
            checked={preferences.marketingEmails}
            onCheckedChange={(checked) =>
              setPreferences((prev) => ({
                ...prev,
                marketingEmails: checked === true,
              }))
            }
          />
          <div className="ml-3 text-sm">
            <Label htmlFor="email_marketing" className="font-medium text-gray-700">
              Marketing emails
            </Label>
            <p className="text-gray-500">
              Receive tips, updates, and promotional content from HomesBin
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button
            onClick={() => updatePreferences()}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
