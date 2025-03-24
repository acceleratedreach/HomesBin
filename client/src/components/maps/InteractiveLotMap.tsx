import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, Download, Plus, Trash2 } from "lucide-react";

// Sample lot/property data for demonstration
interface LotData {
  id: string;
  number: string;
  status: "available" | "sold" | "pending";
  sqft: number;
  price: number;
  coordinates: [number, number][];
}

const sampleLots: LotData[] = [
  {
    id: "lot-1",
    number: "101",
    status: "available",
    sqft: 5200,
    price: 275000,
    coordinates: [[100, 100], [200, 100], [200, 200], [100, 200]]
  },
  {
    id: "lot-2",
    number: "102",
    status: "sold",
    sqft: 4800,
    price: 250000,
    coordinates: [[210, 100], [300, 100], [300, 180], [210, 180]]
  },
  {
    id: "lot-3",
    number: "103",
    status: "pending",
    sqft: 6100,
    price: 320000,
    coordinates: [[100, 210], [200, 210], [200, 320], [100, 320]]
  },
  {
    id: "lot-4",
    number: "104",
    status: "available",
    sqft: 5500,
    price: 290000,
    coordinates: [[210, 190], [300, 190], [300, 300], [210, 300]]
  }
];

interface InteractiveLotMapProps {
  projectName?: string;
}

export default function InteractiveLotMap({ projectName = "Woodland Estates" }: InteractiveLotMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapName, setMapName] = useState(projectName);
  const [selectedLot, setSelectedLot] = useState<LotData | null>(null);
  const [lots, setLots] = useState<LotData[]>(sampleLots);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newLot, setNewLot] = useState<{
    coordinates: [number, number][];
    number: string;
    price: number;
    sqft: number;
  }>({
    coordinates: [],
    number: "",
    price: 0,
    sqft: 0
  });
  const { toast } = useToast();

  // Draw the map on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw road
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(50, 150, 300, 30);

    // Draw lots
    lots.forEach(lot => {
      // Set color based on status
      if (lot.status === 'available') {
        ctx.fillStyle = 'rgba(79, 70, 229, 0.2)';
        ctx.strokeStyle = 'rgb(79, 70, 229)';
      } else if (lot.status === 'sold') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.strokeStyle = 'rgb(239, 68, 68)';
      } else if (lot.status === 'pending') {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.strokeStyle = 'rgb(245, 158, 11)';
      }

      // Draw polygon for lot
      ctx.beginPath();
      lot.coordinates.forEach((coord, index) => {
        if (index === 0) {
          ctx.moveTo(coord[0], coord[1]);
        } else {
          ctx.lineTo(coord[0], coord[1]);
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = selectedLot?.id === lot.id ? 3 : 1;
      ctx.stroke();

      // Add lot number
      ctx.fillStyle = '#000';
      ctx.font = '14px Arial';
      const centerX = lot.coordinates.reduce((sum, coord) => sum + coord[0], 0) / lot.coordinates.length;
      const centerY = lot.coordinates.reduce((sum, coord) => sum + coord[1], 0) / lot.coordinates.length;
      ctx.fillText(lot.number, centerX - 8, centerY + 5);
    });

    // Draw new lot in progress if drawing
    if (isDrawing && newLot.coordinates.length > 0) {
      ctx.fillStyle = 'rgba(147, 197, 253, 0.3)';
      ctx.strokeStyle = 'rgb(59, 130, 246)';
      ctx.beginPath();
      
      newLot.coordinates.forEach((coord, index) => {
        if (index === 0) {
          ctx.moveTo(coord[0], coord[1]);
        } else {
          ctx.lineTo(coord[0], coord[1]);
        }
      });
      
      // Connect to mouse position for preview
      const lastPos = newLot.coordinates[newLot.coordinates.length - 1];
      if (lastPos) {
        ctx.lineTo(lastPos[0], lastPos[1]);
      }
      
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [lots, selectedLot, isDrawing, newLot]);

  // Handle canvas click for lot selection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDrawing) {
      // Add point to new lot
      setNewLot(prev => ({
        ...prev,
        coordinates: [...prev.coordinates, [x, y] as [number, number]]
      }));
      return;
    }

    // Check if clicked inside a lot
    let found = false;
    for (const lot of lots) {
      if (isPointInPolygon([x, y], lot.coordinates)) {
        setSelectedLot(lot);
        found = true;
        break;
      }
    }

    if (!found) {
      setSelectedLot(null);
    }
  };

  // Check if point is inside polygon using ray casting algorithm
  const isPointInPolygon = (point: [number, number], polygon: [number, number][]) => {
    const x = point[0];
    const y = point[1];
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  };

  const handleSaveMap = () => {
    toast({
      title: "Map Saved",
      description: `${mapName} has been saved successfully.`,
    });
  };

  const handleAddNewLot = () => {
    if (isDrawing) {
      // Finish drawing
      if (newLot.coordinates.length < 3) {
        toast({
          title: "Not enough points",
          description: "Please add at least 3 points to create a lot.",
          variant: "destructive"
        });
        return;
      }

      // Generate an ID for the new lot
      const newLotId = `lot-${Math.random().toString(36).substring(2, 9)}`;
      
      // Add the new lot
      setLots(prev => [
        ...prev,
        {
          id: newLotId,
          number: newLot.number || `${lots.length + 1}`,
          status: "available",
          sqft: newLot.sqft || 5000,
          price: newLot.price || 250000,
          coordinates: newLot.coordinates
        }
      ]);
      
      // Reset new lot state
      setNewLot({
        coordinates: [],
        number: "",
        price: 0,
        sqft: 0
      });
      
      setIsDrawing(false);
      
      toast({
        title: "Lot Added",
        description: "New lot has been added to the map.",
      });
    } else {
      // Start drawing mode
      setIsDrawing(true);
      setSelectedLot(null);
      
      toast({
        title: "Drawing Mode Activated",
        description: "Click on the map to add points for your new lot.",
      });
    }
  };

  const handleRemoveLot = (lotId: string) => {
    setLots(prev => prev.filter(lot => lot.id !== lotId));
    setSelectedLot(null);
    
    toast({
      title: "Lot Removed",
      description: "The lot has been removed from the map.",
    });
  };

  const handleCancelDrawing = () => {
    setIsDrawing(false);
    setNewLot({
      coordinates: [],
      number: "",
      price: 0,
      sqft: 0
    });
  };

  const handleDownloadMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${mapName.replace(/\s+/g, "-").toLowerCase()}-map.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Map Downloaded",
      description: "The map image has been downloaded.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Interactive Lot Map</CardTitle>
              <CardDescription>Create and manage your development lots</CardDescription>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleSaveMap}>
                <Save className="mr-2 h-4 w-4" />
                Save Map
              </Button>
              <Button variant="outline" onClick={handleDownloadMap}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2 w-1/3">
              <Label htmlFor="mapName">Map Name</Label>
              <Input 
                id="mapName" 
                value={mapName} 
                onChange={(e) => setMapName(e.target.value)} 
                placeholder="Enter development name"
              />
            </div>
            <div>
              <Button 
                onClick={handleAddNewLot} 
                variant={isDrawing ? "destructive" : "default"}
              >
                {isDrawing ? (
                  <>Finish Drawing</>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Lot
                  </>
                )}
              </Button>
              {isDrawing && (
                <Button
                  variant="outline"
                  className="ml-2"
                  onClick={handleCancelDrawing}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="border rounded-md p-2 bg-white">
              <canvas 
                ref={canvasRef} 
                width={400} 
                height={400} 
                onClick={handleCanvasClick} 
                className="cursor-crosshair"
              />
              <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                <div>
                  {isDrawing ? (
                    <span className="text-blue-600 font-medium">
                      Drawing Mode: Click to add points ({newLot.coordinates.length} points added)
                    </span>
                  ) : (
                    <span>Click on a lot to view details</span>
                  )}
                </div>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-primary mr-1"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                    <span>Sold</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
                    <span>Pending</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              {isDrawing ? (
                <Card>
                  <CardHeader>
                    <CardTitle>New Lot Details</CardTitle>
                    <CardDescription>Enter information for the new lot</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="lotNumber">Lot Number</Label>
                      <Input 
                        id="lotNumber" 
                        value={newLot.number} 
                        onChange={(e) => setNewLot(prev => ({...prev, number: e.target.value}))} 
                        placeholder="e.g. 105"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lotPrice">Price ($)</Label>
                      <Input 
                        id="lotPrice" 
                        type="number" 
                        value={newLot.price || ""} 
                        onChange={(e) => setNewLot(prev => ({...prev, price: parseInt(e.target.value)}))} 
                        placeholder="e.g. 250000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lotSqft">Square Feet</Label>
                      <Input 
                        id="lotSqft" 
                        type="number" 
                        value={newLot.sqft || ""} 
                        onChange={(e) => setNewLot(prev => ({...prev, sqft: parseInt(e.target.value)}))} 
                        placeholder="e.g. 5000"
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : selectedLot ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>Lot #{selectedLot.number}</CardTitle>
                        <CardDescription>View and edit lot details</CardDescription>
                      </div>
                      <Badge 
                        className={
                          selectedLot.status === "available" ? "bg-primary" : 
                          selectedLot.status === "sold" ? "bg-red-500" : 
                          "bg-amber-500"
                        }
                      >
                        {selectedLot.status.charAt(0).toUpperCase() + selectedLot.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Price</Label>
                        <p className="text-xl font-medium">${selectedLot.price.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Square Footage</Label>
                        <p className="text-xl font-medium">{selectedLot.sqft.toLocaleString()} sq ft</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lotStatus">Status</Label>
                      <select 
                        id="lotStatus"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedLot.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as LotData['status'];
                          setLots(prev => 
                            prev.map(lot => 
                              lot.id === selectedLot.id 
                                ? {...lot, status: newStatus} 
                                : lot
                            )
                          );
                          setSelectedLot(prev => prev ? {...prev, status: newStatus} : null);
                        }}
                      >
                        <option value="available">Available</option>
                        <option value="pending">Pending</option>
                        <option value="sold">Sold</option>
                      </select>
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRemoveLot(selectedLot.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Lot
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="border rounded-md p-6 h-full flex flex-col items-center justify-center text-center space-y-4 bg-muted/30">
                  <h3 className="text-lg font-medium">Lot Details</h3>
                  <p className="text-muted-foreground">
                    Select a lot on the map to view details, or click "Add New Lot" to create a new one.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
