import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import EmailVerificationAlert from "@/components/layout/EmailVerificationAlert";
import EmailTemplateForm from "@/components/marketing/EmailTemplateForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Plus, Send, Copy, X, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate } from "@shared/schema";

export default function EmailMarketing() {
  const [openNewTemplate, setOpenNewTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();
  
  const { data: userSession } = useQuery({
    queryKey: ['/api/auth/session'],
  });
  
  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/email-templates'],
  });
  
  const handleSendEmail = () => {
    // In a real app, this would send the email
    toast({
      title: "Email Campaign Started",
      description: "Your email campaign has been scheduled for delivery.",
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
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">Email Marketing</h1>
                <p className="text-muted-foreground">
                  Create and manage email campaigns for your listings
                </p>
              </div>
              
              <Button onClick={() => setOpenNewTemplate(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Template
              </Button>
            </div>
            
            <Tabs defaultValue="templates">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="templates">Email Templates</TabsTrigger>
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              </TabsList>
              
              <TabsContent value="templates" className="mt-6 space-y-6">
                {isLoading ? (
                  <div className="text-center py-12">Loading templates...</div>
                ) : templates && templates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template: EmailTemplate) => (
                      <Card key={template.id}>
                        <CardHeader className="pb-3">
                          <CardTitle>{template.name}</CardTitle>
                          <CardDescription className="truncate">{template.subject}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {template.content}
                          </p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button variant="outline" size="sm" onClick={() => setSelectedTemplate(template)}>
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button size="sm">
                            <Send className="h-4 w-4 mr-1" /> Use
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No email templates yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Create your first email template to get started with email marketing
                      </p>
                      <Button onClick={() => setOpenNewTemplate(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Create Template
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                <Dialog open={openNewTemplate} onOpenChange={setOpenNewTemplate}>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Create Email Template</DialogTitle>
                      <DialogDescription>
                        Design a reusable email template for your marketing campaigns
                      </DialogDescription>
                    </DialogHeader>
                    <EmailTemplateForm onSuccess={() => setOpenNewTemplate(false)} />
                  </DialogContent>
                </Dialog>
                
                <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Edit Email Template</DialogTitle>
                      <DialogDescription>
                        Update your email template
                      </DialogDescription>
                    </DialogHeader>
                    {selectedTemplate && (
                      <EmailTemplateForm 
                        template={selectedTemplate}
                        isEditing={true}
                        onSuccess={() => setSelectedTemplate(null)}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </TabsContent>
              
              <TabsContent value="campaigns" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>New Email Campaign</CardTitle>
                    <CardDescription>
                      Create a new email marketing campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="campaignName">Campaign Name</Label>
                        <Input id="campaignName" placeholder="Spring Listings Announcement" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emailTemplate">Email Template</Label>
                        <select 
                          id="emailTemplate"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="" disabled selected>Select a template</option>
                          {templates && templates.map((template: EmailTemplate) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Recipients</h3>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1" /> Add Recipient
                        </Button>
                      </div>
                      
                      <div className="border rounded-md divide-y">
                        <div className="p-3 flex justify-between items-center">
                          <div>
                            <p className="font-medium">John Smith</p>
                            <p className="text-sm text-muted-foreground">john@example.com</p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-3 flex justify-between items-center">
                          <div>
                            <p className="font-medium">Sarah Johnson</p>
                            <p className="text-sm text-muted-foreground">sarah@example.com</p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label>Schedule</Label>
                      <div className="flex space-x-2">
                        <div className="flex items-center">
                          <input type="radio" id="sendNow" name="schedule" value="now" className="mr-2" />
                          <Label htmlFor="sendNow">Send immediately</Label>
                        </div>
                        <div className="flex items-center">
                          <input type="radio" id="sendLater" name="schedule" value="later" className="mr-2" />
                          <Label htmlFor="sendLater">Schedule for later</Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button variant="outline">Preview</Button>
                    <Button onClick={handleSendEmail}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Campaign
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
