import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import EmailVerification from "@/components/settings/EmailVerification";
import ProfileForm from "@/components/settings/ProfileForm";
import PasswordForm from "@/components/settings/PasswordForm";
import NotificationPreferences from "@/components/settings/NotificationPreferences";
import ConnectedAccounts from "@/components/settings/ConnectedAccounts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Settings() {
  const { data: userSession } = useQuery<{ user: any }>({
    queryKey: ['/api/auth/session'],
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={!!userSession?.user} />
      
      <div className="flex-grow flex">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-8">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your account settings and preferences</p>
              </div>
              
              <EmailVerification />
              
              <Tabs defaultValue="profile">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="password">Password</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="mt-6">
                  <ProfileForm />
                </TabsContent>
                
                <TabsContent value="password" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Password</CardTitle>
                      <CardDescription>Update your password</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PasswordForm />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="preferences" className="mt-6">
                  <NotificationPreferences />
                </TabsContent>
              </Tabs>
              
              <ConnectedAccounts />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  <CardDescription>Irreversible and destructive actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Delete Account</h4>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all of your content
                        </p>
                      </div>
                      <button className="bg-white py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
