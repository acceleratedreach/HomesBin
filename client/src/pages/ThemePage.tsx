import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Palette, Home, Layers, Type, Check, SquareStack, Paintbrush } from "lucide-react";

export default function ThemePage() {
  const { data: userSession } = useQuery({
    queryKey: ['/api/auth/session'],
  });
  
  const { toast } = useToast();
  
  // Theme state
  const [selectedColor, setSelectedColor] = useState("#4f46e5");
  const [selectedTheme, setSelectedTheme] = useState("professional");
  const [selectedMode, setSelectedMode] = useState("light");
  const [borderRadius, setBorderRadius] = useState(0.5);
  
  // Font settings
  const [primaryFont, setPrimaryFont] = useState("Inter");
  const [fontSize, setFontSize] = useState(16);
  
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
  
  // Themes
  const themes = [
    { id: "professional", name: "Professional", description: "Clean, corporate look" },
    { id: "tint", name: "Tint", description: "Soft, muted colors" },
    { id: "vibrant", name: "Vibrant", description: "Bold, eye-catching design" }
  ];
  
  const fonts = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Montserrat",
    "Playfair Display"
  ];
  
  const handleSaveTheme = () => {
    // In a real implementation, we would save the theme settings to the server
    // For now, we'll just show a success toast
    toast({
      title: "Theme Updated",
      description: "Your brand theme has been updated successfully.",
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!userSession?.user} />
      
      <div className="flex-grow flex">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            <EmailVerificationAlert />
            
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Theme Settings</h1>
              <p className="text-muted-foreground">
                Customize your brand appearance across all marketing materials
              </p>
            </div>
            
            <Tabs defaultValue="colors">
              <TabsList className="grid w-full grid-cols-3">
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
                    <CardTitle>Theme Style</CardTitle>
                    <CardDescription>Choose the overall look and feel</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup 
                      defaultValue={selectedTheme}
                      onValueChange={setSelectedTheme}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      {themes.map((theme) => (
                        <Label
                          key={theme.id}
                          htmlFor={theme.id}
                          className={`cursor-pointer flex flex-col border rounded-md p-4 ${
                            selectedTheme === theme.id ? 'border-primary bg-primary/5' : 'border-muted'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={theme.id} id={theme.id} />
                            <span className="font-medium">{theme.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{theme.description}</p>
                          <div className="mt-3 grid grid-cols-5 gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div 
                                key={i} 
                                className="h-4 rounded" 
                                style={{ 
                                  backgroundColor: selectedColor,
                                  opacity: theme.id === "professional" ? 0.7 + (i * 0.1) :
                                           theme.id === "tint" ? 0.3 + (i * 0.15) :
                                           0.5 + (i * 0.15)
                                }}
                              />
                            ))}
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>
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
                            <div className="h-5 w-12 rounded" style={{ backgroundColor: selectedColor }} className="mt-3"></div>
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
                      defaultValue="cards"
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <Label
                        htmlFor="cards-layout"
                        className="cursor-pointer flex flex-col border rounded-md p-4 border-primary bg-primary/5"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cards" id="cards-layout" />
                          <span className="font-medium">Cards</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="h-12 bg-white border rounded"></div>
                          <div className="h-12 bg-white border rounded"></div>
                          <div className="h-12 bg-white border rounded"></div>
                          <div className="h-12 bg-white border rounded"></div>
                        </div>
                      </Label>
                      
                      <Label
                        htmlFor="list-layout"
                        className="cursor-pointer flex flex-col border rounded-md p-4 border-muted"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="list" id="list-layout" />
                          <span className="font-medium">List</span>
                        </div>
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
                      
                      <Label
                        htmlFor="grid-layout"
                        className="cursor-pointer flex flex-col border rounded-md p-4 border-muted"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="grid" id="grid-layout" />
                          <span className="font-medium">Grid</span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-1">
                          <div className="h-8 bg-white border rounded"></div>
                          <div className="h-8 bg-white border rounded"></div>
                          <div className="h-8 bg-white border rounded"></div>
                          <div className="h-8 bg-white border rounded"></div>
                          <div className="h-8 bg-white border rounded"></div>
                          <div className="h-8 bg-white border rounded"></div>
                        </div>
                      </Label>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveTheme}>
                <Paintbrush className="h-4 w-4 mr-2" />
                Save Theme
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
