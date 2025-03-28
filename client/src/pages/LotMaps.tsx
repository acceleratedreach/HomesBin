import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link, useParams } from "wouter";
import Header from "@/components/layout/Header";
import DashboardSidebar from "@/components/layout/Sidebar";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Plus, Map, Edit, ExternalLink, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

export default function LotMaps() {
  const params = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMapDialog, setNewMapDialog] = useState(false);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const { user, isAuthenticated, loading: authLoading } = useSupabaseAuth();
  
  // Get username from URL params
  const usernameFromUrl = params.username;
  
  // Get profile data for the authenticated user
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['lotmaps-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile for lot maps:', error);
          return null;
        }
        
        return data;
      } catch (e) {
        console.error('Exception in profile query for lot maps:', e);
        return null;
      }
    },
    enabled: !!user?.id && isAuthenticated,
  });
  
  // Construct user info from Supabase auth + profile
  const userData = user ? {
    id: user.id,
    username: profileData?.username || user.user_metadata?.username || user.email?.split('@')[0] || '',
    email: user.email || '',
    fullName: profileData?.full_name || user.user_metadata?.full_name || ''
  } : null;
  
  // Get all user's maps from Supabase
  const { data: maps = [], isLoading: mapsLoading } = useQuery<any[]>({
    queryKey: ['lot-maps', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      try {
        const { data, error } = await supabase
          .from('lot_maps')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching lot maps:', error);
          return [];
        }
        
        return data || [];
      } catch (e) {
        console.error('Exception in lot maps query:', e);
        return [];
      }
    },
    enabled: !!user?.id && isAuthenticated,
  });
  
  // If we're directly accessing the /lot-maps route, redirect to /:username/lot-maps
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && !usernameFromUrl) {
      const username = userData?.username;                       
      if (username) {
        console.log(`Redirecting to user-specific lot maps: /${username}/lot-maps`);
        navigate(`/${username}/lot-maps`, { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, user, userData, usernameFromUrl, navigate]);
  
  // Check if user is accessing their own lot maps, redirect if not
  useEffect(() => {
    if (isAuthenticated && usernameFromUrl && userData) {
      if (usernameFromUrl !== userData.username) {
        console.log(`User ${userData.username} trying to access ${usernameFromUrl}'s lot maps, redirecting`);
        navigate(`/${userData.username}/lot-maps`, { replace: true });
      }
    }
  }, [isAuthenticated, userData, usernameFromUrl, navigate]);

  const createNewMap = async (formData: FormData) => {
    try {
      if (!userData?.username || !user?.id) {
        throw new Error("Please wait for user data to load");
      }

      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      
      if (!name) {
        throw new Error("Map name is required");
      }
      
      // Generate slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      
      // Create new map directly in Supabase
      const { data: newMap, error } = await supabase
        .from('lot_maps')
        .insert({
          name,
          description,
          slug,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active'
        })
        .select('*')
        .single();
      
      if (error) {
        throw new Error(error.message || "Failed to create new map");
      }
      
      setNewMapDialog(false);
      
      // Invalidate the maps query to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['lot-maps', user.id] });
      
      toast({
        title: "Success",
        description: `Map "${name}" created successfully.`,
      });
      
      // Navigate to the editor
      navigate(`/${userData.username}/lot-maps/${newMap.slug}/editor`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };
  
  const handleDeleteMap = async () => {
    if (!selectedMapId || !user?.id) return;
    
    try {
      // Delete map directly from Supabase
      const { error } = await supabase
        .from('lot_maps')
        .delete()
        .eq('id', selectedMapId)
        .eq('user_id', user.id); // Make sure the user can only delete their own maps
      
      if (error) {
        throw new Error(error.message || "Failed to delete map");
      }
      
      setConfirmDeleteDialog(false);
      setSelectedMapId(null);
      
      // Invalidate the maps query to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['lot-maps', user.id] });
      
      toast({
        title: "Success",
        description: "Map deleted successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };
  
  const confirmDelete = (mapId: string) => {
    setSelectedMapId(mapId);
    setConfirmDeleteDialog(true);
  };
  
  // Show loading state when checking auth or fetching data
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-lg mb-2">Loading lot maps...</p>
        <p className="text-sm text-muted-foreground">Retrieving your map data...</p>
      </div>
    );
  }
  
  // Show authentication required message if not logged in
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-lg mb-2">Authentication required</p>
        <p className="text-sm text-muted-foreground mb-4">Please log in to view your lot maps</p>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={true} />
      
      <div className="flex-grow flex">
        <DashboardSidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            <EmailVerificationAlert />
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">Interactive Lot Maps</h1>
                <p className="text-muted-foreground">
                  Create and manage development maps for your projects
                </p>
              </div>
              
              <Button onClick={() => setNewMapDialog(true)}>
                <Plus className="h-4 w-4 mr-2" /> New Lot Map
              </Button>
            </div>
            
            {mapsLoading ? (
              <div className="text-center py-12">Loading your lot maps...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {maps.length > 0 ? (
                  maps.map((map: any) => (
                    <Card key={map.id}>
                      <CardHeader className="pb-3">
                        <CardTitle>{map.name}</CardTitle>
                        <CardDescription>{map.description || "No description"}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video bg-muted rounded-md mb-4 flex items-center justify-center overflow-hidden">
                          {map.background_image ? (
                            <img
                              src={map.background_image}
                              alt={map.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Map className="h-12 w-12 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Slug: {map.slug}</span>
                          <span className="text-muted-foreground">
                            Created: {new Date(map.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <Link href={`/${userData?.username}/lot-maps/${map.slug}/editor`}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <a href={`/homesbin.com/${map.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" /> View
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmDelete(map.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <>
                    <Card className="col-span-3">
                      <CardContent className="flex flex-col items-center justify-center h-full p-12">
                        <Map className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No lot maps created yet</h3>
                        <p className="text-muted-foreground text-center mb-6">
                          Create your first interactive lot map to showcase your developments
                        </p>
                        <Button onClick={() => setNewMapDialog(true)}>
                          <Plus className="h-4 w-4 mr-2" /> Create New Lot Map
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                )}
                
                {maps.length > 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center h-full p-6">
                      <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center mb-4">
                        Create a new lot map
                      </p>
                      <Button variant="outline" onClick={() => setNewMapDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" /> New Lot Map
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            {/* New Map Dialog */}
            <Dialog open={newMapDialog} onOpenChange={setNewMapDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Lot Map</DialogTitle>
                  <DialogDescription>
                    Create a new interactive lot map for your development project.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  createNewMap(new FormData(e.currentTarget));
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Map Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="E.g., Oakridge Development"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Brief description of this development"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setNewMapDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Map</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            
            {/* Delete Confirmation Dialog */}
            <Dialog open={confirmDeleteDialog} onOpenChange={setConfirmDeleteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Lot Map</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this lot map? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setConfirmDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteMap}>
                    Delete Map
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
