import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabase } from "@/hooks/use-supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface SupabaseProfileDataProps {
  userId: number;
  className?: string;
}

export default function SupabaseProfileData({ userId, className }: SupabaseProfileDataProps) {
  const { useSupabaseQuery } = useSupabase('profile_extras');
  
  const { data: profileExtras, isLoading, isError } = useSupabaseQuery({
    filters: { user_id: userId },
    enabled: !!userId,
  });

  const hasProfileData = profileExtras && profileExtras.length > 0;
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Extended Profile</CardTitle>
        <CardDescription>
          Additional profile data from Supabase
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
            No extended profile data found. This data is stored in Supabase.
          </div>
        ) : (
          <div className="space-y-4">
            {profileExtras.map((extra: any) => (
              <div key={extra.id} className="space-y-2">
                {Object.entries(extra)
                  .filter(([key]) => !['id', 'user_id', 'created_at', 'updated_at'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-4 text-sm">
                      <div className="font-medium capitalize">{key.replace('_', ' ')}</div>
                      <div className="col-span-2">{value as string}</div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}