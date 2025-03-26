import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface LotEditorProps {
  lot: any;
  mapId: number;
  onClose: () => void;
}

interface FormData {
  number: string;
  status: string;
  price: string;
  sqft: string;
  bedrooms: string;
  bathrooms: string;
  description: string;
  amenities: string[];
  svgPath: string;
  [key: string]: any;
}

export default function LotEditor({ lot, mapId, onClose }: LotEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = !lot.id;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    number: lot.number || "",
    status: lot.status || "available",
    price: lot.price || "",
    sqft: lot.sqft || "",
    bedrooms: lot.bedrooms || "",
    bathrooms: lot.bathrooms || "",
    description: lot.description || "",
    amenities: lot.amenities || [],
    svgPath: lot.svgPath || "",
    ...lot
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const method = isNew ? 'POST' : 'PATCH';
      const endpoint = isNew 
        ? `/api/lots` 
        : `/api/lots/${lot.id}`;
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          mapId,
          price: formData.price ? Number(formData.price) : null,
          sqft: formData.sqft ? Number(formData.sqft) : null,
          bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
          amenities: formData.amenities.filter(Boolean),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save property");
      }
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: [`/api/lots?mapId=${mapId}`] });
      
      toast({
        title: "Success",
        description: `Property ${isNew ? 'created' : 'updated'} successfully.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmenityChange = (index: number, value: string) => {
    const newAmenities = [...formData.amenities];
    newAmenities[index] = value;
    setFormData((prev: FormData) => ({ ...prev, amenities: newAmenities }));
  };

  const addAmenity = () => {
    setFormData((prev: FormData) => ({ ...prev, amenities: [...prev.amenities, ""] }));
  };

  const removeAmenity = (index: number) => {
    setFormData((prev: FormData) => ({
      ...prev,
      amenities: prev.amenities.filter((_: string, i: number) => i !== index)
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isNew ? "New Property" : "Edit Property"}</CardTitle>
        <CardDescription>
          {isNew ? "Add a new property to the map" : "Update property details"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">Lot Number</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData((prev: FormData) => ({ ...prev, number: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((prev: FormData) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData((prev: FormData) => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sqft">Square Feet</Label>
              <Input
                id="sqft"
                type="number"
                value={formData.sqft}
                onChange={(e) => setFormData((prev: FormData) => ({ ...prev, sqft: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData((prev: FormData) => ({ ...prev, bedrooms: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                step="0.5"
                value={formData.bathrooms}
                onChange={(e) => setFormData((prev: FormData) => ({ ...prev, bathrooms: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev: FormData) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Amenities</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAmenity}
              >
                Add Amenity
              </Button>
            </div>
            <div className="space-y-2">
              {formData.amenities.map((amenity: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={amenity}
                    onChange={(e) => handleAmenityChange(index, e.target.value)}
                    placeholder="Enter amenity"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAmenity(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {formData.svgPath && (
            <div className="space-y-2">
              <Label>SVG Path</Label>
              <div className="p-2 bg-muted rounded-md text-xs font-mono">
                {formData.svgPath}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 