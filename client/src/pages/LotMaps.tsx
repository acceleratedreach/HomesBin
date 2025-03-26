import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
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

export default function LotMaps() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMapDialog, setNewMapDialog] = useState(false);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null);
  
  // Get current user session
  const { data: sessionData } = useQuery<{ user: any }>({
    queryKey: ['/api/auth/session'],
  });
  
  // Get user data
  const { data: userData } = useQuery<any>({
    queryKey: ['/api/user'],
    enabled: !!sessionData?.user,
  });
  
  // Get all user's maps
  const { data: maps = [], isLoading: mapsLoading } = useQuery<any[]>({
    queryKey: ['/api/map-settings'],
    enabled: !!sessionData?.user,
  });

  const createNewMap = async (formData: FormData) => {
    try {
      if (!userData?.username) {
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
      
      const response = await fetch('/api/map-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          slug,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create new map");
      }
      
      const newMap = await response.json();
      setNewMapDialog(false);
      
      // Invalidate the maps query to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['/api/map-settings'] });
      
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
    if (!selectedMapId) return;
    
    try {
      const response = await fetch(`/api/map-settings/${selectedMapId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete map");
      }
      
      setConfirmDeleteDialog(false);
      setSelectedMapId(null);
      
      // Invalidate the maps query to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['/api/map-settings'] });
      
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
  
  const confirmDelete = (mapId: number) => {
    setSelectedMapId(mapId);
    setConfirmDeleteDialog(true);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!sessionData?.user} />
      
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
                          {map.backgroundImage ? (
                            <img
                              src={map.backgroundImage}
                              alt={map.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Map className="h-12 w-12 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">ID: {map.id}</span>
                          <span className="text-muted-foreground">
                            Created: {new Date(map.createdAt).toLocaleDateString()}
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
          </div>
        </main>
      </div>
      
      {/* New Map Dialog */}
      <Dialog open={newMapDialog} onOpenChange={setNewMapDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Lot Map</DialogTitle>
            <DialogDescription>
              Enter the details for your new interactive lot map
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createNewMap(formData);
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Map Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Woodland Estates"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="e.g., New luxury development in North Hills"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setNewMapDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Map
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteDialog} onOpenChange={setConfirmDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lot map? This action cannot be undone 
              and will delete all associated lots.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMap}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
