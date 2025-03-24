import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import SocialGraphicGenerator from "@/components/marketing/SocialGraphicGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Listing } from "@shared/schema";

export default function ListingGraphics() {
  const { data: userSession } = useQuery({
    queryKey: ['/api/auth/session'],
  });
  
  const { data: listings } = useQuery({
    queryKey: ['/api/listings'],
  });
  
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!userSession?.user} />
      
      <div className="flex-grow flex">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            <EmailVerificationAlert />
            
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Listing Graphics</h1>
              <p className="text-muted-foreground">
                Create professional marketing graphics for your properties
              </p>
            </div>
            
            {listings && listings.length > 0 && (
              <div className="mb-6">
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-40">
                        <Select 
                          onValueChange={(value) => {
                            const selected = listings.find(l => l.id === parseInt(value));
                            setSelectedListing(selected || null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a listing" />
                          </SelectTrigger>
                          <SelectContent>
                            {listings.map((listing) => (
                              <SelectItem key={listing.id} value={listing.id.toString()}>
                                {listing.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {selectedListing 
                          ? `Selected: ${selectedListing.title}`
                          : "Select a property to create graphics for"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <Tabs defaultValue="social">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="social">Social Media</TabsTrigger>
                <TabsTrigger value="print">Print Materials</TabsTrigger>
                <TabsTrigger value="video">Video Tours</TabsTrigger>
              </TabsList>
              
              <TabsContent value="social" className="mt-6">
                <SocialGraphicGenerator listing={selectedListing || undefined} />
              </TabsContent>
              
              <TabsContent value="print" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Print Materials</CardTitle>
                    <CardDescription>Create flyers, brochures, and postcards</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="aspect-[8.5/11] bg-muted rounded-md flex items-center justify-center mb-3">
                            <p className="text-muted-foreground">Flyer Preview</p>
                          </div>
                          <Button className="w-full" disabled={!selectedListing}>
                            Create Flyer
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="aspect-[8.5/11] bg-muted rounded-md flex items-center justify-center mb-3">
                            <p className="text-muted-foreground">Brochure Preview</p>
                          </div>
                          <Button className="w-full" disabled={!selectedListing}>
                            Create Brochure
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="aspect-[4/3] bg-muted rounded-md flex items-center justify-center mb-3">
                            <p className="text-muted-foreground">Postcard Preview</p>
                          </div>
                          <Button className="w-full" disabled={!selectedListing}>
                            Create Postcard
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      <p>Print material generation is coming soon!</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="video" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Video Tours</CardTitle>
                    <CardDescription>Create and manage virtual tours for your listings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium mb-2">Video tours coming soon</h3>
                      <p className="text-muted-foreground mb-6">
                        Create professional video tours for your listings with our upcoming video generator
                      </p>
                      <Button disabled>Join Waitlist</Button>
                    </div>
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
