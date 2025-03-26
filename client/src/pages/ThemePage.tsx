import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import DashboardSidebar from "@/components/layout/Sidebar";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Palette, Home, Layers, Type, Check, SquareStack, Paintbrush, Layout } from "lucide-react";
import { TemplateSelector } from "@/components/profile/templates";

interface UserSession {
  user?: { 
    id?: string;
    username?: string;
    fullName?: string;
    profileImage?: string;
  };
}

export default function ThemePage() {
  const { data: userSession } = useQuery<UserSession>({
    queryKey: ['/api/auth/session'],
  });
  
  const { toast } = useToast();
  
  // Theme state
  const [selectedColor, setSelectedColor] = useState("#4f46e5");
  const [selectedTemplate, setSelectedTemplate] = useState("professional");
  const [selectedMode, setSelectedMode] = useState("light");
  const [borderRadius, setBorderRadius] = useState(0.5);
  
  // Font settings
  const [primaryFont, setPrimaryFont] = useState("Inter");
  const [fontSize, setFontSize] = useState(16);

  // Demo data for template preview
  const demoUserData = {
    username: "johndoe",
    fullName: "John Doe",
    email: "john@example.com",
    phone: "(555) 123-4567",
    profileImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&h=200&q=80",
    bio: "Real estate professional with over 10 years of experience helping clients buy and sell properties in the metropolitan area. Specializing in residential properties and investment opportunities.",
    location: "Los Angeles, CA",
    experience: "10+ years",
    specialties: ["Residential", "Commercial", "Luxury Homes", "Investment Properties"],
    licenses: ["Licensed Real Estate Agent #123456", "Certified Negotiation Expert", "Luxury Home Specialist"]
  };

  const demoListings = [
    {
      id: 1,
      title: "Modern Downtown Condo",
      address: "123 Main Street, Unit 5B",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      price: 750000,
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1200,
      description: "Beautiful modern condo in the heart of downtown with stunning city views.",
      status: "Active",
      images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"]
    },
    {
      id: 2,
      title: "Spacious Family Home",
      address: "456 Oak Avenue",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90002",
      price: 1250000,
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2800,
      description: "Gorgeous family home with large backyard in a quiet and friendly neighborhood.",
      status: "Active",
      images: ["https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=800&q=80"]
    }
  ];
  
  // Colors for the theme palette
  const colorPalette = [
    { color: "#4f46e5", name: "Primary Blue" },
    { color: "#2563eb", name: "Royal Blue" },
    { color: "#3b82f6", name: "Sky Blue" },
    { color: "#8b5cf6", name: "Purple" },
    { color: "#ec4899", name: "Pink" },
    { color: "#ef4444", name: "Red" },
    { color: "#f59e0b", name: "Amber" },
    { color: "#10b981", name: "Green" },
  ];
  
  const fonts = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Montserrat",
    "Playfair Display"
  ];

  // Current theme for template preview
  const previewTheme = {
    primaryColor: selectedColor,
    colorMode: selectedMode,
    fontFamily: primaryFont,
    fontSize: fontSize,
    borderRadius: borderRadius * 16, // Convert from rem to px
    socialLinksEnabled: true,
    contactFormEnabled: true,
    featuredListingsLayout: 'grid'
  };
  
  // Mock function for saving theme settings
  const { mutate: saveTheme, isPending: isSaving } = useMutation({
    mutationFn: async (themeSettings: any) => {
      // Simulate API call
      console.log("Saving theme settings:", themeSettings);
      // Fake delay to simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      return themeSettings;
    },
    onSuccess: () => {
      toast({
        title: "Theme Updated",
        description: "Your brand theme and profile template have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "There was a problem saving your theme settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSaveTheme = () => {
    // Create theme settings object
    const themeSettings = {
      primaryColor: selectedColor,
      colorMode: selectedMode,
      fontFamily: primaryFont,
      fontSize: fontSize,
      borderRadius: borderRadius * 16, // Convert from rem to px
      template: selectedTemplate,
      socialLinksEnabled: true,
      contactFormEnabled: true,
      featuredListingsLayout: 'grid'
    };
    
    // Use the mutation to save theme settings
    saveTheme(themeSettings);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!userSession?.user} />
      
      <div className="flex-grow flex">
        <DashboardSidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            <EmailVerificationAlert />
            
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Theme Settings</h1>
              <p className="text-muted-foreground">
                Customize your brand appearance across all marketing materials
              </p>
            </div>
            
            <Tabs defaultValue="templates">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="templates">
                  <Layout className="h-4 w-4 mr-2" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="colors">
                  <Palette className="h-4 w-4 mr-2" />
                  Colors
                </TabsTrigger>
                <TabsTrigger value="typography">
                  <Type className="h-4 w-4 mr-2" />
                  Typography
                </TabsTrigger>
                <TabsTrigger value="layout">
                  <Layers className="h-4 w-4 mr-2" />
                  Layout
                </TabsTrigger>
              </TabsList>

              <TabsContent value="templates" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Templates</CardTitle>
                    <CardDescription>Select a template for your public profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TemplateSelector
                      currentTemplate={selectedTemplate}
                      onChange={setSelectedTemplate}
                      demoUserData={demoUserData}
                      demoListings={demoListings}
                      theme={previewTheme}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="colors" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Brand Colors</CardTitle>
                    <CardDescription>Choose your primary brand color</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                      {colorPalette.map((color) => (
                        <div key={color.color} className="text-center">
                          <button
                            className="w-12 h-12 rounded-full inline-block border-2 relative"
                            style={{ 
                              backgroundColor: color.color,
                              borderColor: selectedColor === color.color ? "#000" : "transparent" 
                            }}
                            onClick={() => setSelectedColor(color.color)}
                          >
                            {selectedColor === color.color && (
                              <Check className="absolute inset-0 m-auto text-white h-6 w-6" />
                            )}
                          </button>
                          <p className="text-xs mt-1">{color.name}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <Label htmlFor="customColor">Custom Color</Label>
                      <div className="flex gap-3 mt-2">
                        <div 
                          className="w-10 h-10 rounded border" 
                          style={{ backgroundColor: selectedColor }}
                        />
                        <Input
                          id="customColor"
                          type="text"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="text-base font-medium mb-3">Preview</h3>
                      <div className="flex flex-wrap gap-2">
                        <div className="px-3 py-2 rounded" style={{ backgroundColor: selectedColor, color: "#fff" }}>
                          Primary
                        </div>
                        <div className="px-3 py-2 rounded bg-white" style={{ color: selectedColor, border: `1px solid ${selectedColor}` }}>
                          Secondary
                        </div>
                        <Button style={{ backgroundColor: selectedColor }}>
                          Button
                        </Button>
                        <Button variant="outline" style={{ borderColor: selectedColor, color: selectedColor }}>
                          Outline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Choose light or dark mode</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Label
                        htmlFor="light-mode"
                        className={`cursor-pointer flex-1 flex flex-col items-center border rounded-md p-4 ${
                          selectedMode === "light" ? 'border-primary bg-primary/5' : 'border-muted'
                        }`}
                      >
                        <div className="h-32 w-full mb-4 rounded bg-white border flex justify-center items-center">
                          <div className="w-2/3">
                            <div className="h-3 rounded bg-gray-200 mb-2"></div>
                            <div className="h-3 rounded bg-gray-200 mb-2 w-2/3"></div>
                            <div className="h-3 rounded bg-gray-200 w-1/2"></div>
                            <div className="h-5 w-12 rounded bg-primary-600 mt-3"></div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroup value={selectedMode} onValueChange={setSelectedMode} className="flex">
                            <RadioGroupItem value="light" id="light-mode" />
                          </RadioGroup>
                          <span>Light Mode</span>
                        </div>
                      </Label>
                      
                      <Label
                        htmlFor="dark-mode"
                        className={`cursor-pointer flex-1 flex flex-col items-center border rounded-md p-4 ${
                          selectedMode === "dark" ? 'border-primary bg-primary/5' : 'border-muted'
                        }`}
                      >
                        <div className="h-32 w-full mb-4 rounded bg-gray-800 border flex justify-center items-center">
                          <div className="w-2/3">
                            <div className="h-3 rounded bg-gray-600 mb-2"></div>
                            <div className="h-3 rounded bg-gray-600 mb-2 w-2/3"></div>
                            <div className="h-3 rounded bg-gray-600 w-1/2"></div>
                            <div className="h-5 w-12 rounded mt-3" style={{ backgroundColor: selectedColor }}></div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroup value={selectedMode} onValueChange={setSelectedMode} className="flex">
                            <RadioGroupItem value="dark" id="dark-mode" />
                          </RadioGroup>
                          <span>Dark Mode</span>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="typography" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Typography</CardTitle>
                    <CardDescription>Choose fonts and sizes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="primary-font">Primary Font</Label>
                      <select 
                        id="primary-font"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={primaryFont}
                        onChange={(e) => setPrimaryFont(e.target.value)}
                      >
                        {fonts.map((font) => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="base-font-size">Base Font Size</Label>
                        <span className="text-sm text-muted-foreground">{fontSize}px</span>
                      </div>
                      <Slider
                        id="base-font-size"
                        min={12}
                        max={24}
                        step={1}
                        value={[fontSize]}
                        onValueChange={(value) => setFontSize(value[0])}
                      />
                    </div>
                    
                    <div className="border rounded-md p-6 space-y-4" style={{ fontFamily: primaryFont }}>
                      <h1 className="text-3xl font-bold" style={{ fontSize: `${fontSize * 1.75}px` }}>Heading 1</h1>
                      <h2 className="text-2xl font-bold" style={{ fontSize: `${fontSize * 1.5}px` }}>Heading 2</h2>
                      <h3 className="text-xl font-bold" style={{ fontSize: `${fontSize * 1.25}px` }}>Heading 3</h3>
                      <p style={{ fontSize: `${fontSize}px` }}>
                        This is an example paragraph text to show how your content will look with the selected font and size settings.
                        Good typography makes your content more readable and enhances your brand's professional appearance.
                      </p>
                      <div className="flex gap-2" style={{ fontSize: `${fontSize}px` }}>
                        <Button>Primary Button</Button>
                        <Button variant="outline">Secondary Button</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="layout" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Layout Settings</CardTitle>
                    <CardDescription>Customize spacing and layout options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="border-radius">Border Radius</Label>
                        <span className="text-sm text-muted-foreground">{borderRadius}rem</span>
                      </div>
                      <Slider
                        id="border-radius"
                        min={0}
                        max={2}
                        step={0.1}
                        value={[borderRadius]}
                        onValueChange={(value) => setBorderRadius(value[0])}
                      />
                    </div>
                    
                    <div className="border rounded-md p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-3">
                        <div 
                          className="h-16 border-2 border-dashed border-muted-foreground flex items-center justify-center"
                          style={{ borderRadius: `${borderRadius}rem` }}
                        >
                          Element
                        </div>
                        <p className="text-xs text-center text-muted-foreground">Border Radius: {borderRadius}rem</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div 
                          className="h-16 flex items-center justify-center"
                          style={{ backgroundColor: selectedColor, borderRadius: `${borderRadius}rem`, color: 'white' }}
                        >
                          Filled
                        </div>
                        <p className="text-xs text-center text-muted-foreground">Primary Background</p>
                      </div>
                      
                      <div className="space-y-3">
                        <Button 
                          className="w-full h-16"
                          style={{ borderRadius: `${borderRadius}rem` }}
                        >
                          Button
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">Button Component</p>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="text-base font-medium mb-3">Layout Preview</h3>
                      <div className="w-full h-48 bg-gray-100 rounded overflow-hidden" style={{ borderRadius: `${borderRadius}rem` }}>
                        <div className="h-12 bg-gray-200 border-b flex items-center px-4">
                          <div className="h-4 w-24 bg-gray-300 rounded"></div>
                          <div className="ml-auto flex gap-2">
                            <div className="h-6 w-16 bg-gray-300 rounded" style={{ borderRadius: `${borderRadius}rem` }}></div>
                            <div className="h-6 w-16 bg-primary-600 rounded" style={{ borderRadius: `${borderRadius}rem` }}></div>
                          </div>
                        </div>
                        <div className="p-4 grid grid-cols-3 gap-3">
                          <div className="col-span-2 h-24 bg-white rounded border" style={{ borderRadius: `${borderRadius}rem` }}></div>
                          <div className="h-24 bg-white rounded border" style={{ borderRadius: `${borderRadius}rem` }}></div>
                          <div className="h-24 bg-white rounded border" style={{ borderRadius: `${borderRadius}rem` }}></div>
                          <div className="h-24 bg-white rounded border" style={{ borderRadius: `${borderRadius}rem` }}></div>
                          <div className="h-24 bg-white rounded border" style={{ borderRadius: `${borderRadius}rem` }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Content Layout</CardTitle>
                    <CardDescription>Choose default layout for your content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup 
                      defaultValue="grid"
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <Label
                        htmlFor="grid-layout"
                        className="cursor-pointer flex flex-col border rounded-md p-4 border-primary bg-primary/5"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="grid" id="grid-layout" />
                          <span className="font-medium">Grid Layout</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Display listings in a grid format</p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="h-10 bg-white border rounded"></div>
                          <div className="h-10 bg-white border rounded"></div>
                          <div className="h-10 bg-white border rounded"></div>
                          <div className="h-10 bg-white border rounded"></div>
                        </div>
                      </Label>
                      
                      <Label
                        htmlFor="list-layout"
                        className="cursor-pointer flex flex-col border rounded-md p-4 border-muted"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="list" id="list-layout" />
                          <span className="font-medium">List Layout</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Display listings in a list format</p>
                        <div className="mt-3 space-y-2">
                          <div className="h-6 bg-white border rounded flex items-center px-2">
                            <div className="h-3 w-3 bg-gray-300 rounded-full mr-2"></div>
                            <div className="h-2 w-full bg-gray-100 rounded"></div>
                          </div>
                          <div className="h-6 bg-white border rounded flex items-center px-2">
                            <div className="h-3 w-3 bg-gray-300 rounded-full mr-2"></div>
                            <div className="h-2 w-full bg-gray-100 rounded"></div>
                          </div>
                          <div className="h-6 bg-white border rounded flex items-center px-2">
                            <div className="h-3 w-3 bg-gray-300 rounded-full mr-2"></div>
                            <div className="h-2 w-full bg-gray-100 rounded"></div>
                          </div>
                        </div>
                      </Label>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveTheme} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Paintbrush className="h-4 w-4 mr-2" />
                    Save Theme
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
