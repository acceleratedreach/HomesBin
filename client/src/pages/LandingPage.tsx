import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { AlertCircle, Home, User, BarChart3, Share2, Zap, Map } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="bg-amber-50 border border-amber-200 rounded-md mx-auto max-w-7xl my-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-amber-800">Please verify your email address to access all features.</p>
          <Button variant="outline" size="sm" className="text-xs bg-white border border-amber-300 text-amber-800 hover:bg-amber-50">
            Resend verification email
          </Button>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 flex-grow">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-12">
          <div className="px-6 py-12 sm:px-12 lg:py-16">
            <h2 className="text-4xl font-extrabold text-center sm:text-5xl">
              <span className="block text-primary-600">Market Your Real Estate</span>
              <span className="block text-gray-900">Like Never Before</span>
            </h2>
            <p className="mt-4 text-lg text-center text-gray-500">
              Create beautiful listing pages to showcase your properties and build your real estate brand with our powerful platform.
            </p>
            <div className="mt-8 flex justify-center">
              <Button asChild size="lg" className="font-medium">
                <Link href="/dashboard">
                  Go to Dashboard
                  <AlertCircle className="ml-2 -mr-1 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="ml-4 font-medium">
                <Link href="/profile">
                  View My Profile
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-16">
          <Card>
            <CardContent className="p-6">
              <div className="bg-primary-100 p-3 rounded-full inline-block">
                <Home className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Professional Listings</h3>
              <p className="mt-2 text-base text-gray-500">
                Create stunning property listings with photos, details, and virtual tours that attract buyers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="bg-primary-100 p-3 rounded-full inline-block">
                <User className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Agent Branding</h3>
              <p className="mt-2 text-base text-gray-500">
                Build your personal brand with customizable agent profiles that showcase your expertise.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="bg-primary-100 p-3 rounded-full inline-block">
                <BarChart3 className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Lead Generation</h3>
              <p className="mt-2 text-base text-gray-500">
                Capture and manage leads with built-in forms and automated follow-up tools.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="bg-primary-100 p-3 rounded-full inline-block">
                <Share2 className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Social Integration</h3>
              <p className="mt-2 text-base text-gray-500">
                Share your listings on social media with one click and expand your reach.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="bg-primary-100 p-3 rounded-full inline-block">
                <Zap className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">AI-Powered Tools</h3>
              <p className="mt-2 text-base text-gray-500">
                Generate listing descriptions, social posts, and email campaigns with AI assistance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="bg-primary-100 p-3 rounded-full inline-block">
                <Map className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Interactive Lot Maps</h3>
              <p className="mt-2 text-base text-gray-500">
                Create interactive development maps to showcase available lots and properties in your projects.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="py-12 px-8 text-center mb-16">
          <CardContent className="p-0">
            <h2 className="text-3xl font-bold text-gray-900">Ready to Transform Your Real Estate Business?</h2>
            <p className="mt-4 text-lg text-gray-500">
              Join thousands of successful agents who have boosted their sales with our platform.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="font-medium">
                <Link href="/dashboard">
                  Go to Dashboard
                  <AlertCircle className="ml-2 -mr-1 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-8 mt-16 sm:grid-cols-3">
          <div className="text-center">
            <div className="flex justify-center">
              <AlertCircle className="h-10 w-10 text-primary-600" />
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
              <AlertCircle className="h-10 w-10 text-primary-600" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Secure Platform</h3>
            <p className="mt-1 text-sm text-gray-500">Your data is protected with enterprise-grade security measures.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
