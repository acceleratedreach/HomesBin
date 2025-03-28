import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { useQuery } from "@tanstack/react-query";
import { 
  AlertCircle, 
  Home, 
  User, 
  BarChart3, 
  Share2, 
  Zap, 
  Map, 
  Building, 
  Globe, 
  Shield 
} from "lucide-react";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { useEffect, useState } from "react";

export default function LandingPage() {
  interface UserData {
    id: number;
    username: string;
    email: string;
    emailVerified?: boolean;
  }

  interface SessionData {
    user: UserData;
  }
  
  // Check if the user is authenticated
  const { data: sessionData } = useQuery<SessionData>({
    queryKey: ['/api/auth/session'],
  });
  
  // Check if user is authenticated but email is not verified
  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
    enabled: !!sessionData?.user,
  });
  
  const isAuthenticated = !!sessionData?.user;
  const emailVerified = userData?.emailVerified;
  const showVerificationBanner = isAuthenticated && emailVerified === false;
  
  // State to control when to show the content below the hero section
  const [showContent, setShowContent] = useState(false);
  
  // Set content to show after a delay to allow the animation to play
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <Header isAuthenticated={isAuthenticated} />
        
        {/* Verification banner - only shown when logged in but not verified */}
        {showVerificationBanner && (
          <div className="bg-amber-50 border border-amber-200 rounded-md mx-auto max-w-7xl my-4 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-amber-800">Please verify your email address to access all features.</p>
              <Button variant="outline" size="sm" className="text-xs bg-white border border-amber-300 text-amber-800 hover:bg-amber-50">
                Resend verification email
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Hero Section with Background Paths */}
      <div className="w-full h-screen">
        <BackgroundPaths 
          title="Real Estate Marketing" 
          subtitle="Create beautiful listing pages to showcase your properties and build your real estate brand with our powerful platform."
          buttonText={isAuthenticated ? "Go to Dashboard" : "Get Started"} 
          buttonLink={isAuthenticated ? "/dashboard" : "/register"}
        />
      </div>
      
      {/* Main Content (Only shows after animation) */}
      {showContent && (
        <div className="bg-slate-50 pt-16 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Feature Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-16">
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="bg-blue-100 p-3 rounded-full inline-block">
                    <Home className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Professional Listings</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Create stunning property listings with photos, details, and virtual tours that attract buyers.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="bg-violet-100 p-3 rounded-full inline-block">
                    <User className="h-6 w-6 text-violet-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Agent Branding</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Build your personal brand with customizable agent profiles that showcase your expertise.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="bg-indigo-100 p-3 rounded-full inline-block">
                    <BarChart3 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Lead Generation</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Capture and manage leads with built-in forms and automated follow-up tools.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="bg-green-100 p-3 rounded-full inline-block">
                    <Share2 className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Social Integration</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Share your listings on social media with one click and expand your reach.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="bg-amber-100 p-3 rounded-full inline-block">
                    <Zap className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">AI-Powered Tools</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Generate listing descriptions, social posts, and email campaigns with AI assistance.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="bg-red-100 p-3 rounded-full inline-block">
                    <Map className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Interactive Lot Maps</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Create interactive development maps to showcase available lots and properties in your projects.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CTA Section */}
            <Card className="py-12 px-8 text-center mb-16 bg-white">
              <CardContent className="p-0">
                <h2 className="text-3xl font-bold text-gray-900">Ready to Transform Your Real Estate Business?</h2>
                <p className="mt-4 text-lg text-gray-500">
                  Join thousands of successful agents who have boosted their sales with our platform.
                </p>
                <div className="mt-8">
                  {isAuthenticated ? (
                    <Button asChild size="lg" className="font-medium">
                      <Link href="/dashboard">
                        Go to Dashboard
                        <svg className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg" className="font-medium">
                      <Link href="/register">
                        Sign Up Today
                        <svg className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Benefits Section */}
            <div className="grid grid-cols-1 gap-8 mt-12 sm:grid-cols-3">
              <div className="text-center">
                <div className="flex justify-center">
                  <Globe className="h-10 w-10 text-primary-600" />
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Global Reach</h3>
                <p className="mt-1 text-sm text-gray-500">Expand your market with listings that can be viewed worldwide.</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center">
                  <Zap className="h-10 w-10 text-primary-600" />
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Instant Updates</h3>
                <p className="mt-1 text-sm text-gray-500">Make changes to your listings in real time with our intuitive editor.</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center">
                  <Shield className="h-10 w-10 text-primary-600" />
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Secure Platform</h3>
                <p className="mt-1 text-sm text-gray-500">Your data is protected with enterprise-grade security measures.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}