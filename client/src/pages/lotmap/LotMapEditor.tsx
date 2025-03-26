import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Header from "@/components/layout/Header";
import DashboardSidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, Download, ArrowLeft, Plus } from "lucide-react";
import LotMapCanvas from "./LotMapCanvas";
import LotEditor from "./LotEditor";
import LotList from "./LotList";

export default function LotMapEditor() {
  const params = useParams<{ slug: string, username: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mapData, setMapData] = useState<any>(null);
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("canvas");
  const [showLotEditor, setShowLotEditor] = useState(false);
  const [newLot, setNewLot] = useState(false);
  
  // Get current user session
  const { data: sessionData } = useQuery<{ user: any }>({
    queryKey: ['/api/auth/session'],
  });
  
  // Get user data
  const { data: userData } = useQuery<any>({
    queryKey: ['/api/user'],
    enabled: !!sessionData?.user,
  });
  
  // Get the map data
  const { data: mapSettings, isLoading: mapLoading } = useQuery<any>({
    queryKey: [`/api/map-settings?slug=${params.slug}`],
    enabled: !!params.slug,
  });
  
  // Update mapData when mapSettings changes
  useEffect(() => {
    if (mapSettings) {
      setMapData(mapSettings);
    }
  }, [mapSettings]);
  
  // Get lots for this map
  const { data: lots = [], isLoading: lotsLoading } = useQuery<any[]>({
    queryKey: [`/api/lots?mapId=${mapData?.id}`],
    enabled: !!mapData?.id,
  });
  
  const saveMap = async (formData: FormData) => {
    try {
      if (!mapData) return;
      
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      
      const response = await fetch(`/api/map-settings/${mapData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: mapData.id,
          name,
          description,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update map settings");
      }
      
      // Invalidate the queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: [`/api/map-settings?slug=${params.slug}`] });
      
      toast({
        title: "Success",
        description: "Map settings updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };
  
  const handleBackToMaps = () => {
    navigate(`/${userData?.username}/lot-maps`);
  };
  
  const handleUploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    // Implementation for file upload would go here
    
    toast({
      title: "Background Upload",
      description: "Feature not implemented: Would upload background image",
    });
  };
  
  if (mapLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading map data...</div>;
  }
  
  if (!mapData && !mapLoading) {
    return <div className="min-h-screen flex items-center justify-center">Map not found</div>;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!sessionData?.user} />
      
      <div className="flex-grow flex">
        <DashboardSidebar />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleBackToMaps}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Editing: {mapData?.name}</h1>
                  <p className="text-muted-foreground">
                    Make changes to your lot map and properties
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab("settings")}>
                  Map Settings
                </Button>
                <Button>
                  <Save className="h-4 w-4 mr-2" /> Save Map
                </Button>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="canvas">Canvas</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="canvas">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-3">
                    <Card>
                      <CardHeader>
                        <CardTitle>Map Canvas</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        {mapLoading ? (
                          <div className="h-[500px] flex items-center justify-center">
                            <p>Loading map data...</p>
                          </div>
                        ) : (
                          <div className="h-[500px]">
                            <LotMapCanvas 
                              mapData={mapData}
                              lots={lots} 
                              onSelectLot={(lot) => {
                                setSelectedLot(lot);
                                // No need to open editor automatically on select
                              }}
                              onUpdateLot={(updatedLot) => {
                                // This would update a lot's position/dimensions
                                toast({
                                  title: "Update Lot",
                                  description: `Updated lot ${updatedLot.number} position/dimensions`,
                                });
                              }}
                              onCreateLot={(newLot) => {
                                // This would create a new lot from canvas
                                toast({
                                  title: "Create Lot",
                                  description: "New lot would be created (feature not fully implemented)",
                                });
                              }}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="md:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle>Property Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedLot ? (
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-medium">Lot #{selectedLot.number}</h3>
                              <p className="text-sm text-muted-foreground">{selectedLot.description}</p>
                            </div>
                            <Button onClick={() => setShowLotEditor(true)}>
                              Edit Details
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <p>Select a property on the map to edit details</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    {showLotEditor && selectedLot && (
                      <div className="mt-4">
                        <LotEditor 
                          lot={selectedLot} 
                          mapId={mapData?.id}
                          onClose={() => setShowLotEditor(false)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="properties">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Manage Properties</CardTitle>
                    <Button size="sm" onClick={() => setNewLot(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Add Property
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {lotsLoading ? (
                      <p>Loading properties...</p>
                    ) : (
                      <LotList 
                        lots={lots} 
                        onEdit={(lot) => {
                          setSelectedLot(lot);
                          setShowLotEditor(true);
                        }} 
                        onDelete={(lotId) => {
                          // Implementation for deleting lot
                          toast({
                            title: "Delete Lot",
                            description: `Lot ${lotId} would be deleted (feature not fully implemented)`,
                          });
                        }} 
                      />
                    )}
                  </CardContent>
                </Card>
                
                {newLot && (
                  <div className="mt-6">
                    <LotEditor 
                      lot={{}} 
                      mapId={mapData?.id}
                      onClose={() => setNewLot(false)}
                    />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Map Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      saveMap(formData);
                    }}>
                      <div className="grid gap-4 mb-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Map Name</Label>
                          <Input
                            id="name"
                            name="name"
                            defaultValue={mapData?.name}
                            required
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            name="description"
                            defaultValue={mapData?.description || ""}
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="background">Background Image</Label>
                          <Input
                            id="background"
                            name="background"
                            type="file"
                            accept="image/*"
                            onChange={handleUploadBackground}
                          />
                          <p className="text-sm text-muted-foreground">
                            Upload a map or aerial image to use as background
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button type="submit">
                          <Save className="h-4 w-4 mr-2" /> Save Settings
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
} 