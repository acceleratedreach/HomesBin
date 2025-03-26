import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Home, DollarSign, Ruler, BedDouble, Bath } from "lucide-react";

interface Lot {
  id: number;
  number: string;
  status: string;
  price: number;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
  amenities: string[];
  svgPath: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MapData {
  id: number;
  name: string;
  description: string;
  backgroundImage: string;
  isPublic: boolean;
}

export default function PublicLotMapViewer() {
  const params = useParams<{ slug: string }>();
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  
  useEffect(() => {
    async function fetchMapData() {
      try {
        if (!params.slug) return;
        
        const response = await fetch(`/api/map-settings?slug=${params.slug}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch map data");
        }
        
        const data = await response.json();
        setMapData(data[0]); // Assuming the API returns an array with one item
        
        // Fetch lots for this map
        const lotsResponse = await fetch(`/api/lots?mapId=${data[0].id}`);
        if (!lotsResponse.ok) {
          throw new Error("Failed to fetch lots");
        }
        
        const lotsData = await lotsResponse.json();
        setLots(lotsData);
      } catch (error) {
        console.error("Error fetching map data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMapData();
  }, [params.slug]);
  
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "sold":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading lot map...</p>
      </div>
    );
  }
  
  if (!mapData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Map Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              The lot map you are looking for does not exist or is not public.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{mapData.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{mapData.description}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-0">
            <div className="flex justify-end p-4 border-b">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                >
                  -
                </Button>
                <div className="flex items-center px-2 text-sm">
                  {Math.round(scale * 100)}%
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomIn}
                  title="Zoom In"
                >
                  +
                </Button>
              </div>
            </div>
            
            <div 
              className="relative border rounded-md bg-white overflow-hidden"
              style={{ 
                backgroundSize: '20px 20px', 
                backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
                transform: `scale(${scale})`,
                transformOrigin: 'center',
                transition: 'transform 0.2s ease-out'
              }}
            >
              {mapData.backgroundImage && (
                <img 
                  src={mapData.backgroundImage} 
                  alt="Map Background" 
                  className="absolute inset-0 w-full h-full object-contain opacity-50"
                />
              )}
              
              {lots.map((lot) => (
                <div
                  key={lot.id}
                  className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-50 cursor-pointer hover:bg-opacity-70 transition-colors"
                  style={{
                    left: lot.x || 0,
                    top: lot.y || 0,
                    width: lot.width || 100,
                    height: lot.height || 100,
                  }}
                  onClick={() => setSelectedLot(lot)}
                >
                  <div className="p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{lot.number}</span>
                      <Badge className={`${getStatusColor(lot.status)} text-white`}>
                        {lot.status}
                      </Badge>
                    </div>
                    {lot.svgPath && (
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox={`0 0 ${lot.width} ${lot.height}`}
                      >
                        <path
                          d={lot.svgPath}
                          fill="none"
                          stroke="rgb(59, 130, 246)"
                          strokeWidth="2"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
              
              {lots.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center p-6">
                    <p>No properties available in this map</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={!!selectedLot} onOpenChange={() => setSelectedLot(null)}>
        <DialogContent>
          {selectedLot && (
            <>
              <DialogHeader>
                <DialogTitle>Lot {selectedLot.number}</DialogTitle>
                <DialogDescription>
                  <Badge className={`${getStatusColor(selectedLot.status)} text-white`}>
                    {selectedLot.status}
                  </Badge>
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>${selectedLot.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedLot.sqft.toLocaleString()} sq ft</span>
                </div>
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedLot.bedrooms} bedrooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedLot.bathrooms} bathrooms</span>
                </div>
              </div>
              
              {selectedLot.description && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedLot.description}</p>
                </div>
              )}
              
              {selectedLot.amenities && selectedLot.amenities.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLot.amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 