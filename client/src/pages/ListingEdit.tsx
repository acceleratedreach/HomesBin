import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import ListingForm from "@/components/listings/ListingForm";
import ListingDetails from "@/components/listings/ListingDetails";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ListingEdit() {
  const { id } = useParams();
  const listingId = parseInt(id);
  
  const { data: userSession } = useQuery({
    queryKey: ['/api/auth/session'],
  });
  
  const { data: listing, isLoading, error } = useQuery({
    queryKey: [`/api/listings/${listingId}`],
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAuthenticated={!!userSession?.user} />
        
        <div className="flex-grow flex">
          <Sidebar />
          
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
              <div className="text-center py-12">Loading listing details...</div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAuthenticated={!!userSession?.user} />
        
        <div className="flex-grow flex">
          <Sidebar />
          
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
              <div className="text-center py-12">
                <h2 className="text-lg font-medium text-gray-900">Listing Not Found</h2>
                <p className="mt-2 text-sm text-gray-500">
                  The listing you are looking for does not exist or you don't have permission to view it.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!userSession?.user} />
      
      <div className="flex-grow flex">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            <EmailVerificationAlert />
            
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Listing Details</TabsTrigger>
                <TabsTrigger value="edit">Edit Listing</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-6">
                <ListingDetails listingId={listingId} />
              </TabsContent>
              
              <TabsContent value="edit" className="mt-6">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold">Edit Listing</h1>
                  <p className="text-muted-foreground">
                    Update the details of your property listing
                  </p>
                </div>
                
                <ListingForm listing={listing} isEditing={true} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
