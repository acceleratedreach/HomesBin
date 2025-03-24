import { MailService } from '@sendgrid/mail';
import { EmailTemplate, Listing } from '../../shared/schema';

const mailService = new MailService();
const FROM_EMAIL = 'noreply@homesbin.com';

// Make sure the SendGrid API key is set
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.error("SENDGRID_API_KEY environment variable not set. Marketing emails will not work.");
}

export interface MarketingEmailParams {
  subject: string;
  text: string;
  html: string;
  recipients: string[];
  fromName?: string;
  listingData?: Listing;
  unsubscribeLink?: string;
}

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
      const { subject, text, html, recipients, fromName, unsubscribeLink } = params;
      
      console.log(`Sending marketing email to ${recipients.length} recipients`);
      
      // Add unsubscribe link to footer if provided
      let enhancedHtml = html;
      let enhancedText = text;
      
      if (unsubscribeLink) {
        enhancedHtml += `
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>If you no longer wish to receive these emails, you can <a href="${unsubscribeLink}">unsubscribe here</a>.</p>
          </div>
        `;
        
        enhancedText += `\n\nIf you no longer wish to receive these emails, you can unsubscribe here: ${unsubscribeLink}`;
      }
      
      // Create personalization for each recipient
      const personalizations = recipients.map(email => ({
        to: email,
        subject: subject
      }));
      
      // Send email to all recipients at once using personalization
      const msg = {
        personalizations,
        from: {
          email: FROM_EMAIL,
          name: fromName || 'HomesBin'
        },
        text: enhancedText,
        html: enhancedHtml,
        trackingSettings: {
          clickTracking: {
            enable: true
          },
          openTracking: {
            enable: true
          }
        }
      };
      
      const response = await mailService.send(msg as any);
      console.log(`Marketing email sent successfully to ${recipients.length} recipients`);
      return true;
    } catch (error) {
      console.error("Error sending marketing email:", error);
      if (error && typeof error === 'object' && 'response' in error) {
        const errResponse = (error as { response: { body: unknown, statusCode: number } }).response;
        console.error("SendGrid API response:", {
          body: errResponse.body,
          statusCode: errResponse.statusCode
        });
      }
      return false;
    }
  }
  
  /**
   * Generate email content from a template and listing data
   * @param template Email template
   * @param listing Listing data to include in the email
   * @returns Processed email content
   */
  static processTemplate(template: EmailTemplate, listing?: Listing): { subject: string, text: string, html: string } {
    let { subject, text, html } = template;
    
    // Replace template variables with listing data if available
    if (listing) {
      const replacements: Record<string, string> = {
        '{{property_address}}': listing.address || '',
        '{{property_price}}': listing.price ? `$${listing.price.toLocaleString()}` : '',
        '{{property_bedrooms}}': listing.bedrooms?.toString() || '',
        '{{property_bathrooms}}': listing.bathrooms?.toString() || '',
        '{{property_sqft}}': listing.squareFootage?.toString() || '',
        '{{property_description}}': listing.description || '',
        '{{property_type}}': listing.type || '',
        '{{property_year_built}}': listing.yearBuilt?.toString() || '',
        '{{property_features}}': listing.features?.join(', ') || '',
        '{{agent_name}}': '', // Would need to get from user profile
        '{{agent_phone}}': '', // Would need to get from user profile
        '{{agent_email}}': '', // Would need to get from user profile
        '{{property_url}}': `${process.env.SITE_URL || 'https://homesbin.com'}/listings/${listing.id}`
      };
      
      // Replace all occurrences of each placeholder in the content
      Object.entries(replacements).forEach(([placeholder, value]) => {
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        text = text.replace(new RegExp(placeholder, 'g'), value);
        html = html.replace(new RegExp(placeholder, 'g'), value);
      });
    }
    
    return { subject, text, html };
  }
}

export const marketingEmailService = MarketingEmailService;