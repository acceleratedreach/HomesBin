import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Download, Share, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Listing } from "@shared/schema";

// Sample design templates for graphics
const designTemplates = [
  {
    id: "modern",
    name: "Modern",
    preview: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80",
    colors: ["#4F46E5", "#ffffff", "#111827"]
  },
  {
    id: "luxury",
    name: "Luxury",
    preview: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=200&q=80",
    colors: ["#1E293B", "#D1D5DB", "#FCD34D"]
  },
  {
    id: "minimal",
    name: "Minimal",
    preview: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=200&q=80", 
    colors: ["#F9FAFB", "#111827", "#4B5563"]
  },
  {
    id: "bold",
    name: "Bold",
    preview: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=200&q=80",
    colors: ["#EF4444", "#ffffff", "#111827"]
  }
];

// Image dimensions for different platforms
const imageDimensions = {
  instagram: { width: 1080, height: 1080, name: "Instagram Post (1:1)" },
  instagramStory: { width: 1080, height: 1920, name: "Instagram Story (9:16)" },
  facebook: { width: 1200, height: 630, name: "Facebook Post (1.91:1)" },
  twitter: { width: 1200, height: 675, name: "Twitter Post (16:9)" }
};

interface SocialGraphicGeneratorProps {
  listing?: Listing;
}

export default function SocialGraphicGenerator({ listing }: SocialGraphicGeneratorProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState(designTemplates[0].id);
  const [selectedSize, setSelectedSize] = useState<keyof typeof imageDimensions>("instagram");
  const [headline, setHeadline] = useState(listing ? `${listing.bedrooms} bed, ${listing.bathrooms} bath in ${listing.city}` : "Beautiful Home For Sale");
  const [customText, setCustomText] = useState(listing ? `${listing.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}` : "$450,000");
  const [fontSize, setFontSize] = useState(28);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Get all listings for selection if no specific listing is provided
  const { data: listings } = useQuery({
    queryKey: ['/api/listings'],
    enabled: !listing
  });

  const handleGenerateGraphic = () => {
    setIsGenerating(true);
    
    // Simulate graphic generation - in real app, this would call an image generation API
    setTimeout(() => {
      // This is where we'd normally save/load the generated image
      // We're using a placeholder image for demo purposes
      const templateData = designTemplates.find(t => t.id === selectedTemplate);
      const selected = templateData?.preview || designTemplates[0].preview;
      
      // In a real app, we would generate a custom image here with headline, etc.
      // For demo, we're just using one of the template images
      setGeneratedImage(selected.replace('w=200', 'w=800'));
      
      setIsGenerating(false);
      toast({
        title: "Graphic Generated",
        description: "Your social media graphic has been created successfully.",
      });
    }, 1500);
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    // In a real app, we would handle actual download logic
    // For this demo, we just show a success toast
    toast({
      title: "Download Started",
      description: "Your graphic is being downloaded.",
    });
  };

  const handleShare = () => {
    if (!generatedImage) return;
    
    // In a real app, we would integrate with social media sharing APIs
    // For this demo, we just show a success toast
    toast({
      title: "Ready to Share",
      description: "Your graphic has been prepared for sharing on social media.",
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="create">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Graphic</TabsTrigger>
          <TabsTrigger value="preview" disabled={!generatedImage}>Preview & Share</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Selection</CardTitle>
                  <CardDescription>Select a property to feature in your graphic</CardDescription>
                </CardHeader>
                <CardContent>
                  {!listing && listings && (
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent>
                        {listings.map((item: Listing) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {listing && (
                    <div className="p-4 border rounded-md bg-muted/50">
                      <p className="font-medium">{listing.title}</p>
                      <p className="text-sm text-muted-foreground">{listing.address}, {listing.city}</p>
                      <p className="text-sm text-primary mt-1">${listing.price.toLocaleString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Design Options</CardTitle>
                  <CardDescription>Customize the look of your graphic</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Select Template</Label>
                    <RadioGroup 
                      defaultValue={selectedTemplate} 
                      onValueChange={setSelectedTemplate}
                      className="grid grid-cols-2 gap-4"
                    >
                      {designTemplates.map((template) => (
                        <Label
                          key={template.id}
                          htmlFor={template.id}
                          className="cursor-pointer space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={template.id} id={template.id} />
                            <span>{template.name}</span>
                          </div>
                          <img 
                            src={template.preview} 
                            alt={template.name}
                            className="w-full h-24 object-cover rounded-md border"
                          />
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Image Size</Label>
                    <Select 
                      defaultValue={selectedSize}
                      onValueChange={(value: keyof typeof imageDimensions) => setSelectedSize(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(imageDimensions).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content</CardTitle>
                  <CardDescription>Edit text that appears on your graphic</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="headline">Headline</Label>
                    <Input 
                      id="headline" 
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Beautiful Home For Sale"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customText">Price/Custom Text</Label>
                    <Input 
                      id="customText" 
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="$450,000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="fontSize">Font Size</Label>
                      <span className="text-sm">{fontSize}px</span>
                    </div>
                    <Slider
                      id="fontSize"
                      min={14}
                      max={48}
                      step={1}
                      value={[fontSize]}
                      onValueChange={(value) => setFontSize(value[0])}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Additional Details</CardTitle>
                  <CardDescription>Add any additional text for your graphic</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="Add any additional details about the property..."
                    className="min-h-[120px]"
                  />
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button onClick={handleGenerateGraphic} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : "Generate Graphic"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Preview & Download</CardTitle>
              <CardDescription>Your generated social media graphic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {generatedImage && (
                <div className="flex justify-center">
                  <div className="relative border rounded-md overflow-hidden shadow-lg">
                    <img 
                      src={generatedImage} 
                      alt="Generated social media graphic" 
                      className="max-w-full max-h-[500px] object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-6">
                      <div className="text-2xl font-bold">{headline}</div>
                      <div className="text-xl mt-2">{customText}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="outline" 
                  size="lg" 
                  disabled={!generatedImage}
                  onClick={handleDownload}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button 
                  disabled={!generatedImage}
                  size="lg"
                  onClick={handleShare}
                >
                  <Share className="mr-2 h-4 w-4" />
                  Share to Social Media
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
