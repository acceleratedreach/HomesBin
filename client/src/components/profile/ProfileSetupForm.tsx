import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

const profileFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  title: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  location: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  experience: z.string().max(100).optional(),
  specialties: z.string().max(200).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileSetupFormProps {
  initialData?: {
    username?: string;
    fullName?: string;
    email?: string;
  };
  onComplete?: () => void;
}

export default function ProfileSetupForm({ initialData, onComplete }: ProfileSetupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: initialData?.username || "",
      fullName: initialData?.fullName || "",
      title: "",
      phone: "",
      location: "",
      bio: "",
      experience: "",
      specialties: "",
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    try {
      setIsSubmitting(true);
      
      if (!user) {
        throw new Error("You must be logged in to complete your profile");
      }

      console.log("Updating profile with data:", values);

      // Prepare profile data for Supabase
      const profileData = {
        id: user.id,
        username: values.username,
        full_name: values.fullName,
        title: values.title || null,
        phone: values.phone || null,
        location: values.location || null,
        bio: values.bio || null,
        experience: values.experience || null,
        specialties: values.specialties ? values.specialties.split(',').map(s => s.trim()) : null,
        updated_at: new Date().toISOString(),
      };

      // Update the profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select('*')
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        throw new Error(error.message || "Error updating profile");
      }

      toast({
        title: "Profile updated successfully",
        description: "Your profile has been set up and is ready to use.",
      });

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      } else {
        // Otherwise, navigate to dashboard
        navigate(`/${values.username}/dashboard`);
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        title: "Profile update failed",
        description: error.message || "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>
          Please fill out the following information to complete your profile setup.
          Fields marked with an asterisk (*) are required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username *</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormDescription>
                      This will be used in your profile URL.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                      <Input placeholder="Real Estate Agent" {...field} />
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
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
                      <Input placeholder="Los Angeles, CA" {...field} />
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
                      <Input placeholder="5+ years in residential real estate" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="specialties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialties</FormLabel>
                  <FormControl>
                    <Input placeholder="Luxury Homes, First-Time Buyers, Commercial Properties" {...field} />
                  </FormControl>
                  <FormDescription>
                    Separate each specialty with a comma.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell clients a bit about yourself and your approach to real estate..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Complete Profile Setup"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        You can always update your profile information later from your account settings.
      </CardFooter>
    </Card>
  );
} 