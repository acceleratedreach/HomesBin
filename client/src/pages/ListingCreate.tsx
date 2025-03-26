import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import DashboardSidebar from "@/components/layout/Sidebar";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import ListingForm from "@/components/listings/ListingForm";

export default function ListingCreate() {
  const { data: userSession } = useQuery({
    queryKey: ['/api/auth/session'],
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!userSession} />
      
      <div className="flex-grow flex">
        <DashboardSidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            <EmailVerificationAlert />
            
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Create New Listing</h1>
              <p className="text-muted-foreground">
                Enter the details of your property listing
              </p>
            </div>
            
            <ListingForm />
          </div>
        </main>
      </div>
    </div>
  );
}
