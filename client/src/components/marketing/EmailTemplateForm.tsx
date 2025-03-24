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
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { EmailTemplate } from "@shared/schema";

interface EmailTemplateFormProps {
  template?: EmailTemplate;
  isEditing?: boolean;
  onSuccess?: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Email subject is required"),
  content: z.string().min(1, "Email content is required"),
});

export default function EmailTemplateForm({
  template,
  isEditing = false,
  onSuccess,
}: EmailTemplateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: template?.name || "",
      subject: template?.subject || "",
      content: template?.content || "",
    },
  });

  const { mutate: saveTemplate } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      setIsSubmitting(true);
      if (isEditing && template) {
        return await apiRequest('PATCH', `/api/email-templates/${template.id}`, values);
      } else {
        return await apiRequest('POST', '/api/email-templates', values);
      }
    },
    onSuccess: () => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({
        title: isEditing ? "Template updated" : "Template created",
        description: isEditing
          ? "Email template has been updated successfully"
          : "Email template has been created successfully",
      });
      if (onSuccess) onSuccess();
      if (!isEditing) form.reset();
    },
    onError: () => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Failed to save email template. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    saveTemplate(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Email Template" : "Create Email Template"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Update your email template"
            : "Create a reusable email template for your marketing campaigns"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="New Listing Announcement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Check out my new property listing!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Dear [name],

I'm excited to share my latest property listing with you. This beautiful home features [features] and is located in [location].

Click the link below to view more details and pictures:
[listing_link]

Please let me know if you have any questions or would like to schedule a showing.

Best regards,
[your_name]"
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                  ? "Update Template"
                  : "Create Template"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
