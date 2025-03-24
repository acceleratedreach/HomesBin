import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import InteractiveLotMap from "@/components/maps/InteractiveLotMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Plus, Map } from "lucide-react";

export default function LotMaps() {
  const { data: userSession } = useQuery({
    queryKey: ['/api/auth/session'],
  });
  
  // Sample development projects
  const projects = [
    { id: 1, name: "Woodland Estates", lots: 24, location: "North Hills, CA" },
    { id: 2, name: "Riverview Heights", lots: 16, location: "Glendale, AZ" }
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!userSession?.user} />
      
      <div className="flex-grow flex">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            <EmailVerificationAlert />
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">Interactive Lot Maps</h1>
                <p className="text-muted-foreground">
                  Create and manage development maps for your projects
                </p>
              </div>
              
              <Button>
                <Plus className="h-4 w-4 mr-2" /> New Development
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {projects.map(project => (
                <Card key={project.id}>
                  <CardHeader className="pb-3">
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>{project.location}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-muted rounded-md mb-4 flex items-center justify-center overflow-hidden">
                      <Map className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{project.lots} Lots</span>
                      <span className="text-muted-foreground">Last updated: 3 days ago</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline">Edit Map</Button>
                  </CardFooter>
                </Card>
              ))}
              
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-full p-6">
                  <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center mb-4">
                    Create a new development map
                  </p>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> New Development
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <InteractiveLotMap projectName="Woodland Estates" />
          </div>
        </main>
      </div>
    </div>
  );
}
