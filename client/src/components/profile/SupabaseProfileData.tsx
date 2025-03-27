import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchFromSupabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";

interface SupabaseProfileDataProps {
  userId: number | string;
  className?: string;
}

export default function SupabaseProfileData({ userId, className }: SupabaseProfileDataProps) {
  const { user } = useSupabaseAuth();
  
  // Use current logged-in user ID if no userId was provided
  const targetUserId = userId || user?.id;
  
  // Fetch profile data from Supabase profiles table
  const { data: profileData, isLoading, isError } = useQuery({
    queryKey: ['/api/supabase/profiles', targetUserId],
    queryFn: async () => {
      try {
        // Fetch from profiles table
        const data = await fetchFromSupabase('profiles', {
          filters: { id: targetUserId }
        });
        return data?.[0] || null;
      } catch (error) {
        console.error('Error fetching profile data:', error);
        throw error;
      }
    },
    enabled: !!targetUserId,
  });

  const hasProfileData = !!profileData;
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          User profile data stored in Supabase
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load profile data from Supabase
            </AlertDescription>
          </Alert>
        ) : !hasProfileData ? (
          <div className="text-sm text-muted-foreground">
            No profile data found. This data is stored in Supabase.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {Object.entries(profileData)
                .filter(([key]) => 
                  !['id', 'created_at', 'updated_at'].includes(key) && 
                  !!profileData[key]
                )
                .map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-4 text-sm py-2 border-b border-gray-100">
                    <div className="font-medium capitalize">{key.replace(/_/g, ' ')}</div>
                    <div className="col-span-2">
                      {typeof value === 'object' 
                        ? JSON.stringify(value)
                        : String(value)
                      }
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}