import { EmailService, EmailTemplate as EmailServiceTemplate, MarketingEmailParams as EmailServiceParams } from './emailService';
import { EmailTemplate as DatabaseEmailTemplate, Listing } from '../../shared/schema';
import crypto from 'crypto';

// Constants
const FROM_EMAIL = 'noreply@homesbin.com';
const FROM_NAME = 'HomesBin';

/**
 * Parameters for sending marketing emails
 */
export interface MarketingEmailParams {
  subject: string;
  text: string;
  html: string;
  recipients: string[];
  fromName?: string;
  listingData?: Listing;
  unsubscribeLink?: string;
  trackClicks?: boolean;
  trackOpens?: boolean;
}

/**
 * Service for sending marketing emails to clients
 */
export class MarketingEmailService {
  /**
   * Send a marketing email to multiple recipients
   * @param params Email parameters
   * @returns Success boolean
   */
  static async sendMarketingEmail(params: MarketingEmailParams): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.error("Cannot send marketing email: SendGrid API key not configured");
      return false;
    }

    try {
      const { subject, text, html, recipients, fromName, listingData, unsubscribeLink, trackClicks, trackOpens } = params;
      
      console.log(`[Marketing Service] Preparing to send email to ${recipients.length} recipients`);
      
      // Process template with listing data if provided
      let processedTemplate: EmailServiceTemplate = { subject, text, html };
      
      if (listingData) {
        processedTemplate = this.processTemplate({ subject, text, html }, listingData);
      }
      
      // Prepare the email service parameters
      const emailParams: EmailServiceParams = {
        to: recipients,
        subject: processedTemplate.subject,
        text: processedTemplate.text,
        html: processedTemplate.html,
        fromName: fromName || FROM_NAME,
        unsubscribeLink,
        trackClicks: trackClicks !== false,
        trackOpens: trackOpens !== false
      };
      
      // Send the email using the EmailService
      const result = await EmailService.sendMarketingEmail(emailParams);
      
      if (result) {
        console.log(`[Marketing Service] Marketing email sent successfully to ${recipients.length} recipients`);
      } else {
        console.error(`[Marketing Service] Failed to send marketing email to ${recipients.length} recipients`);
      }
      
      return result;
    } catch (error) {
      console.error("[Marketing Service] Error sending marketing email:", error);
      return false;
    }
  }
  
  /**
   * Generate email content from a template and listing data
   * @param template Email template
   * @param listing Listing data to include in the email
   * @returns Processed email content
   */
  static processTemplate(template: EmailServiceTemplate, listing: Listing): EmailServiceTemplate {
    if (!listing) return template;

    // Get template content with fallbacks for empty fields
    let subject = template.subject || '';
    let text = template.text || '';
    let html = template.html || '';
    
    // Convert database template to email service template format if needed
    if (template instanceof Object && 'content' in template && typeof template.content === 'string') {
      const content = (template as unknown as DatabaseEmailTemplate).content || '';
      if (!text) text = content;
      if (!html) html = content;
    }
    
    // Build replacement map for template variables
    const replacements: Record<string, string> = {
      // Support different placeholder formats (with and without braces)
      // {{property_*}} format
      '{{property_address}}': listing.address || '',
      '{{property_price}}': listing.price ? `$${listing.price.toLocaleString()}` : '',
      '{{property_bedrooms}}': listing.bedrooms?.toString() || '',
      '{{property_bathrooms}}': listing.bathrooms?.toString() || '',
      '{{property_sqft}}': (listing.squareFootage || listing.squareFeet || listing.sqft)?.toString() || '',
      '{{property_description}}': listing.description || '',
      '{{property_type}}': listing.propertyType || '',
      '{{property_url}}': `${process.env.SITE_URL || 'https://homesbin.com'}/listings/${listing.id}`,
      
      // {{listing_*}} format
      '{{listing_address}}': listing.address || '',
      '{{listing_price}}': listing.price ? `$${listing.price.toLocaleString()}` : '',
      '{{listing_bedrooms}}': listing.bedrooms?.toString() || '',
      '{{listing_bathrooms}}': listing.bathrooms?.toString() || '',
      '{{listing_sqft}}': (listing.squareFootage || listing.squareFeet || listing.sqft)?.toString() || '',
      '{{listing_description}}': listing.description || '',
      '{{listing_type}}': listing.propertyType || '',
      '{{listing_url}}': `${process.env.SITE_URL || 'https://homesbin.com'}/listings/${listing.id}`,
      '{{listing_city}}': listing.city || '',
      '{{listing_state}}': listing.state || '',
      '{{listing_zipCode}}': listing.zipCode || '',
      '{{listing_title}}': listing.title || '',
      
      // {listing.*} format (for compatibility with EmailService)
      '{listing.address}': listing.address || '',
      '{listing.price}': listing.price ? `$${listing.price.toLocaleString()}` : '',
      '{listing.bedrooms}': listing.bedrooms?.toString() || '',
      '{listing.bathrooms}': listing.bathrooms?.toString() || '',
      '{listing.sqft}': (listing.squareFootage || listing.squareFeet || listing.sqft)?.toString() || '',
      '{listing.description}': listing.description || '',
      '{listing.status}': listing.status || '',
      '{listing.type}': listing.propertyType || '',
      '{listing.url}': `${process.env.SITE_URL || 'https://homesbin.com'}/listings/${listing.id}`,
      '{listing.title}': listing.title || ''
    };
    
    // Process features as a comma-separated list
    if (listing.features) {
      let featuresText = '';
      try {
        if (typeof listing.features === 'string') {
          featuresText = listing.features;
        } else if (Array.isArray(listing.features)) {
          featuresText = listing.features.join(', ');
        } else if (listing.features && typeof listing.features === 'object') {
          featuresText = Object.values(listing.features as Record<string, string>).join(', ');
        }
      } catch (e) {
        console.warn('[Marketing Service] Error processing features:', e);
      }
      
      replacements['{{property_features}}'] = featuresText;
      replacements['{{listing_features}}'] = featuresText;
      replacements['{listing.features}'] = featuresText;
    }
    
    // Apply all replacements to the template
    Object.entries(replacements).forEach(([placeholder, value]) => {
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      text = text.replace(new RegExp(placeholder, 'g'), value);
      html = html.replace(new RegExp(placeholder, 'g'), value);
    });
    
    // If the content doesn't look like HTML, wrap it in a basic HTML template
    if (!html.includes('<html') && !html.includes('<body') && !html.startsWith('<div')) {
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${html.replace(/\n/g, '<br>')}
        </div>
      `;
    }
    
    return { subject, text, html };
  }

  /**
   * Generate a preview of a marketing email
   * @param template Email template
   * @param listing Optional listing data
   * @returns HTML preview of the email
   */
  static generatePreview(template: EmailServiceTemplate, listing?: Listing): EmailServiceTemplate {
    if (listing) {
      return this.processTemplate(template, listing);
    }
    return template;
  }

  /**
   * Generate an unsubscribe link for marketing emails
   * @param userId User ID (agent ID)
   * @param recipientEmail Email to unsubscribe
   * @returns Secure unsubscribe URL
   */
  static generateUnsubscribeUrl(userId: number, recipientEmail: string): string {
    // Generate a hash for security
    const hash = crypto
      .createHash('sha256')
      .update(`${userId}-${recipientEmail}-${process.env.SESSION_SECRET || 'homesbin-secret'}`)
      .digest('hex')
      .substring(0, 12);
    
    // Base64 encode email for the URL
    const encodedEmail = Buffer.from(recipientEmail).toString('base64');
    
    // Generate the URL with validation hash
    const baseUrl = process.env.SITE_URL || 'https://homesbin.com';
    return `${baseUrl}/unsubscribe?uid=${userId}&email=${encodedEmail}&hash=${hash}`;
  }
}

export const marketingEmailService = MarketingEmailService;