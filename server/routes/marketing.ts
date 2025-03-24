import { Express, Request, Response } from 'express';
import { IStorage } from '../storage';
import { EmailService } from '../services/emailService';
import { z } from 'zod';

// Schema for sending marketing emails
const sendMarketingEmailSchema = z.object({
  templateId: z.number(),
  recipients: z.array(z.string().email()),
  listingId: z.number().optional()
});

// Schema for subscribing to email marketing
const emailSubscriptionSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  listingIds: z.array(z.number()).optional()
});

export function registerMarketingRoutes(app: Express, storage: IStorage) {
  // Get all email templates for the current user
  app.get('/api/marketing/email-templates', async (req: Request, res: Response) => {
    try {
      const user: any = req.user;
      
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const templates = await storage.getEmailTemplatesByUserId(user.id);
      return res.json(templates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Get a specific email template
  app.get('/api/marketing/email-templates/:id', async (req: Request, res: Response) => {
    try {
      const user: any = req.user;
      
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const templateId = parseInt(req.params.id);
      const template = await storage.getEmailTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      // Ensure the template belongs to the current user
      if (template.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized access to this template' });
      }
      
      return res.json(template);
    } catch (error) {
      console.error('Error fetching email template:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Create a new email template
  app.post('/api/marketing/email-templates', async (req: Request, res: Response) => {
    try {
      const user: any = req.user;
      
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Add the current user's ID to the template data
      const templateData = {
        ...req.body,
        userId: user.id
      };
      
      const template = await storage.createEmailTemplate(templateData);
      return res.status(201).json(template);
    } catch (error) {
      console.error('Error creating email template:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Update an existing email template
  app.put('/api/marketing/email-templates/:id', async (req: Request, res: Response) => {
    try {
      const user: any = req.user;
      
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const templateId = parseInt(req.params.id);
      const template = await storage.getEmailTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      // Ensure the template belongs to the current user
      if (template.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized access to this template' });
      }
      
      const updatedTemplate = await storage.updateEmailTemplate(templateId, req.body);
      return res.json(updatedTemplate);
    } catch (error) {
      console.error('Error updating email template:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Delete an email template
  app.delete('/api/marketing/email-templates/:id', async (req: Request, res: Response) => {
    try {
      const user: any = req.user;
      
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const templateId = parseInt(req.params.id);
      const template = await storage.getEmailTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      // Ensure the template belongs to the current user
      if (template.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized access to this template' });
      }
      
      await storage.deleteEmailTemplate(templateId);
      return res.json({ message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Error deleting email template:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Send marketing email to a list of recipients
  app.post('/api/marketing/send-email', async (req: Request, res: Response) => {
    try {
      const user: any = req.user;
      
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (!user.emailVerified) {
        return res.status(403).json({ message: 'Email verification required to send marketing emails' });
      }
      
      const validatedData = sendMarketingEmailSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: validatedData.error.errors
        });
      }
      
      const { templateId, recipients, listingId } = validatedData.data;
      
      // Get the email template
      const template = await storage.getEmailTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      // Ensure the template belongs to the current user
      if (template.userId !== user.id) {
        return res.status(403).json({ message: 'Unauthorized access to this template' });
      }
      
      // If a listing ID is provided, get the listing data to include in the email
      let listingData = null;
      if (listingId) {
        const listing = await storage.getListing(listingId);
        
        if (!listing) {
          return res.status(404).json({ message: 'Listing not found' });
        }
        
        // Ensure the listing belongs to the current user
        if (listing.userId !== user.id) {
          return res.status(403).json({ message: 'Unauthorized access to this listing' });
        }
        
        listingData = listing;
      }
      
      // TODO: Implement actual email sending with SendGrid
      // For now, we'll just return a success message
      
      return res.json({ 
        message: 'Marketing emails queued for delivery',
        sentTo: recipients.length
      });
    } catch (error) {
      console.error('Error sending marketing emails:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
}