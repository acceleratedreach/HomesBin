import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email address"),
  fullName: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  experience: z.string().optional(),
  specialties: z.string().optional(), // Will be stored as comma-separated string
  licenses: z.string().optional(), // Will be stored as comma-separated string
  profileImage: z.string().optional(),
});

export default function ProfileForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/user'],
  });

  // Default profile data
  const profileData = {
    username: userData?.username || "",
    email: userData?.email || "",
    fullName: userData?.fullName || "",
    title: userData?.title || "Real Estate Professional",
    phone: userData?.phone || "",
    location: userData?.location || "",
    bio: userData?.bio || "",
    experience: userData?.experience || "",
    specialties: userData?.specialties ? userData.specialties.join(", ") : "",
    licenses: userData?.licenses ? userData.licenses.join(", ") : "",
    profileImage: userData?.profileImage || "",
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: profileData,
    values: profileData,
  });

  const { mutate: updateProfile } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      setIsSubmitting(true);
      
      // Convert comma-separated strings to arrays where needed
      const processedValues = {
        ...values,
        specialties: values.specialties ? values.specialties.split(",").map(s => s.trim()) : undefined,
        licenses: values.licenses ? values.licenses.split(",").map(s => s.trim()) : undefined,
      };
      
      await apiRequest('PATCH', '/api/user', processedValues);
    },
    onSuccess: () => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateProfile(values);
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your account information and profile details</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img 
                    src={imagePreview || profileData.profileImage || "https://via.placeholder.com/150"} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button variant="outline" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h3 className="text-base font-medium">Profile Photo</h3>
                <p className="text-sm text-muted-foreground">Upload a photo for your profile</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. 5+ years" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio / About Me</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={4} 
                      placeholder="Tell potential clients about yourself, your experience, and your expertise..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialties</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Luxury Homes, New Construction, Investment Properties (comma separated)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="licenses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Licenses & Certifications</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="NY Real Estate License #12345 (comma separated)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
