import { Express, Request, Response } from 'express';
import { IStorage } from '../storage';
import { z } from 'zod';
import { EmailTemplate, Listing } from '@shared/schema';
import { marketingEmailService } from '../services/marketingEmailService';

// Define marketing email parameters interface
interface MarketingEmailParams {
  templateId: number;
  recipients: string[];
  listingId?: number;
  fromName?: string;
  unsubscribeLink?: string;
}

// Helper function to send marketing emails
const sendMarketingEmail = async (params: MarketingEmailParams, template: EmailTemplate, listing?: Listing): Promise<boolean> => {
  // Process template with listing data if available
  const { subject, text, html } = marketingEmailService.processTemplate(template, listing);
  
  // Send the email using the marketing email service
  return await marketingEmailService.sendMarketingEmail({
    subject,
    text,
    html,
    recipients: params.recipients,
    fromName: params.fromName,
    listingData: listing,
    unsubscribeLink: params.unsubscribeLink
  });
};

export function registerMarketingRoutes(app: Express, storage: IStorage) {
  // Get all email templates for authenticated user
  app.get('/api/marketing/email-templates', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = req.user as any;
      const templates = await storage.getEmailTemplatesByUserId(user.id);
      
      res.json(templates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get a specific email template
  app.get('/api/marketing/email-templates/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const templateId = parseInt(req.params.id, 10);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: 'Invalid template ID' });
      }

      const template = await storage.getEmailTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      const user = req.user as any;
      if (template.userId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to access this template' });
      }

      res.json(template);
    } catch (error) {
      console.error('Error fetching email template:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Create a new email template
  app.post('/api/marketing/email-templates', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const templateSchema = z.object({
        name: z.string().min(1),
        subject: z.string().min(1),
        content: z.string().min(1)
      });
      
      const result = templateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid template data', errors: result.error.errors });
      }

      const user = req.user as any;
      const template = await storage.createEmailTemplate({
        ...result.data,
        userId: user.id
      });

      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating email template:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update an existing email template
  app.put('/api/marketing/email-templates/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const templateId = parseInt(req.params.id, 10);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: 'Invalid template ID' });
      }

      const template = await storage.getEmailTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      const user = req.user as any;
      if (template.userId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to update this template' });
      }

      const templateSchema = z.object({
        name: z.string().min(1).optional(),
        subject: z.string().min(1).optional(),
        content: z.string().min(1).optional()
      });
      
      const result = templateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid template data', errors: result.error.errors });
      }

      const updatedTemplate = await storage.updateEmailTemplate(templateId, result.data);
      res.json(updatedTemplate);
    } catch (error) {
      console.error('Error updating email template:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Delete an email template
  app.delete('/api/marketing/email-templates/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const templateId = parseInt(req.params.id, 10);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: 'Invalid template ID' });
      }

      const template = await storage.getEmailTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      const user = req.user as any;
      if (template.userId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this template' });
      }

      const deleted = await storage.deleteEmailTemplate(templateId);
      if (deleted) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: 'Failed to delete template' });
      }
    } catch (error) {
      console.error('Error deleting email template:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Send a marketing email
  app.post('/api/marketing/send-email', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const emailSchema = z.object({
        templateId: z.number(),
        recipients: z.array(z.string().email()).min(1),
        listingId: z.number().optional(),
        fromName: z.string().optional(),
        unsubscribeLink: z.string().url().optional()
      });
      
      const result = emailSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid email data', errors: result.error.errors });
      }

      const user = req.user as any;
      
      // Check if user is verified before allowing marketing emails
      if (!user.emailVerified) {
        return res.status(403).json({ message: 'Please verify your email address before sending marketing emails' });
      }

      // Fetch the email template
      const template = await storage.getEmailTemplate(result.data.templateId);
      if (!template) {
        return res.status(404).json({ message: 'Email template not found' });
      }

      // Check if template belongs to the user
      if (template.userId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to use this template' });
      }

      // Fetch listing data if listing ID is provided
      let listing: Listing | undefined;
      if (result.data.listingId) {
        listing = await storage.getListing(result.data.listingId);
        if (!listing) {
          return res.status(404).json({ message: 'Listing not found' });
        }
        
        // Check if listing belongs to the user
        if (listing.userId !== user.id) {
          return res.status(403).json({ message: 'Not authorized to use this listing' });
        }
      }

      // Send the marketing email
      const emailSent = await sendMarketingEmail(result.data, template, listing);

      if (emailSent) {
        res.json({ message: 'Marketing email sent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to send marketing email' });
      }
    } catch (error) {
      console.error('Error sending marketing email:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
}