import { MailService } from '@sendgrid/mail';
import { User, Listing } from '../../shared/schema';
import crypto from 'crypto';
import * as dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

if (!process.env.SENDGRID_API_KEY) {
  console.error(`Error: SENDGRID_API_KEY environment variable is not set in ${process.env.NODE_ENV || 'current'} environment`);
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

// Check SITE_URL after dotenv is loaded
if (!process.env.SITE_URL) {
  console.warn("Warning: SITE_URL environment variable is not set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);
console.log('SendGrid API key configured successfully');

const FROM_EMAIL = 'noreply@homesbin.com';
const FROM_NAME = 'HomesBin';

// Site URL helper function - always use production URL for consistency in emails
const getSiteUrl = (req?: any): string => {
  // If SITE_URL is set in environment, use it
  if (process.env.SITE_URL) {
    return process.env.SITE_URL;
  }
  
  // Otherwise, always use production URL for email links
  console.log('Notice: SITE_URL not set, using default: https://homesbin.com');
  return 'https://homesbin.com';
};

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

export interface MarketingEmailParams {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  fromName?: string;
  unsubscribeLink?: string;
  trackClicks?: boolean;
  trackOpens?: boolean;
}

export class EmailService {
  // Generate a secure token for verification or password reset
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Send a verification email to a user
  static async sendVerificationEmail(userEmail: string, verificationToken: string, req?: any): Promise<boolean> {
    console.log(`[Email Service] Attempting to send verification email to: ${userEmail}`);
    const siteUrl = getSiteUrl(req);
    const verificationLink = `${siteUrl}/verify-email?token=${verificationToken}`;
    console.log('[Email Service] Generated verification link:', verificationLink);

    const template: EmailTemplate = {
      subject: 'Verify your HomesBin account',
      text: `Welcome to HomesBin! Please verify your email to access all of our tools: ${verificationLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a6cf7;">Welcome to HomesBin!</h2>
          <p>Thank you for signing up. Please verify your email address to access all features.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
              style="background-color: #4a6cf7; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;"
              data-click-track="off">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `
    };

    return this.sendEmail(userEmail, template);
  }

  // Send a password reset email to a user
  static async sendPasswordResetEmail(userEmail: string, resetToken: string, req?: any): Promise<boolean> {
    console.log(`[Email Service] Attempting to send password reset email to: ${userEmail}`);
    const siteUrl = getSiteUrl(req);
    const resetLink = `${siteUrl}/reset-password?token=${resetToken}`;
    console.log('[Email Service] Generated password reset link:', resetLink);

    const template: EmailTemplate = {
      subject: 'Reset your HomesBin password',
      text: `You requested to reset your password. Copy and paste this link into your browser to create a new password: ${resetLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a6cf7;">Reset Your Password</h2>
          <p>You've requested to reset your password. Click the button below to create a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
              style="background-color: #4a6cf7; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;"
              data-click-track="off">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetLink}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `
    };

    return this.sendEmail(userEmail, template);
  }

  // Send a welcome email to a new user
  static async sendWelcomeEmail(userEmail: string, userName?: string, req?: any): Promise<boolean> {
    console.log(`[Email Service] Attempting to send welcome email to: ${userEmail}`);
    const siteUrl = getSiteUrl(req);
    const name = userName || 'there';

    const template: EmailTemplate = {
      subject: 'Welcome to HomesBin!',
      text: `Hi ${name}, Welcome to HomesBin! We're excited to take your marketing to the next level.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a6cf7;">Welcome to HomesBin!</h2>
          <p>Hi ${name},</p>
          <p>We're excited to have you on board!</p>
          <p>With HomesBin, you can:</p>
          <ul>
            <li>Create professional listing pages</li>
            <li>Send tailored marketing emails</li>
            <li>Generate social media content</li>
            <li>Create interactive lot maps for developments</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}/dashboard" 
              style="background-color: #4a6cf7; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
          <p>Best regards,<br>The HomesBin Team</p>
        </div>
      `
    };

    return this.sendEmail(userEmail, template);
  }

  /**
   * Process email template with listing data
   * @param template Email template with placeholders
   * @param listing Optional listing data to insert
   * @returns Processed template with listing data
   */
  static processTemplate(template: EmailTemplate, listing?: Listing): EmailTemplate {
    if (!listing) return template;

    let subject = template.subject;
    let text = template.text;
    let html = template.html;

    // Replace listing placeholders
    const replacements: {[key: string]: string} = {
      '{listing.address}': listing.address || '',
      '{listing.price}': listing.price ? `$${listing.price.toLocaleString()}` : '',
      '{listing.bedrooms}': listing.bedrooms?.toString() || '',
      '{listing.bathrooms}': listing.bathrooms?.toString() || '',
      '{listing.sqft}': ((listing as any).squareFootage || (listing as any).sqft || listing.squareFeet)?.toLocaleString() || '',
      '{listing.description}': listing.description || '',
      '{listing.status}': listing.status || '',
      '{listing.type}': listing.propertyType || '',
      '{listing.url}': `${getSiteUrl()}/listings/${listing.id}`,
      '{listing.title}': listing.title || ''
    };

    // Apply replacements
    Object.entries(replacements).forEach(([placeholder, value]) => {
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      text = text.replace(new RegExp(placeholder, 'g'), value);
      html = html.replace(new RegExp(placeholder, 'g'), value);
    });

    return { subject, text, html };
  }

  /**
   * Send a marketing email to one or more recipients
   * @param params Email parameters
   * @returns Success boolean
   */
  static async sendMarketingEmail(params: MarketingEmailParams): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('[Email Service] SendGrid API key not configured');
      return false;
    }

    try {
      console.log('[Email Service] Sending marketing email with following details:', {
        to: params.to,
        subject: params.subject,
        recipients: Array.isArray(params.to) ? params.to.length : 1
      });

      // Ensure unsubscribe link is present for marketing emails
      let html = params.html;
      if (params.unsubscribeLink && !html.includes('unsubscribe')) {
        html += `
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>If you no longer want to receive these emails, you can <a href="${params.unsubscribeLink}">unsubscribe</a>.</p>
          </div>
        `;
      }

      const msg = {
        to: params.to,
        from: {
          email: FROM_EMAIL,
          name: params.fromName || FROM_NAME
        },
        subject: params.subject,
        text: params.text,
        html: html,
        trackingSettings: {
          clickTracking: {
            enable: params.trackClicks !== false
          },
          openTracking: {
            enable: params.trackOpens !== false
          }
        }
      };

      const response = await mailService.send(msg);
      console.log('[Email Service] Marketing email sent successfully');
      return true;
    } catch (error: unknown) {
      console.error('[Email Service] SendGrid email error:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const errResponse = (error as { response: { body: unknown, statusCode: number } }).response;
        console.error('[Email Service] SendGrid API response:', {
          body: errResponse.body,
          statusCode: errResponse.statusCode
        });
      }
      return false;
    }
  }

  /**
   * Send a transactional email to a single recipient
   * @param to Recipient email address
   * @param template Email template
   * @returns Success boolean
   */
  private static async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('[Email Service] SendGrid API key not configured');
      return false;
    }

    try {
      console.log('[Email Service] Sending email with following details:', {
        to,
        from: FROM_EMAIL,
        subject: template.subject,
      });

      const msg = {
        to,
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME
        },
        subject: template.subject,
        text: template.text,
        html: template.html,
        trackingSettings: {
          clickTracking: {
            enable: false
          },
          openTracking: {
            enable: true
          }
        }
      };

      const response = await mailService.send(msg);
      console.log('[Email Service] Email sent successfully to:', to);
      return true;
    } catch (error: unknown) {
      console.error('[Email Service] SendGrid email error:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const errResponse = (error as { response: { body: unknown, statusCode: number } }).response;
        console.error('[Email Service] SendGrid API response:', {
          body: errResponse.body,
          statusCode: errResponse.statusCode
        });
      }
      return false;
    }
  }
}

export const emailService = EmailService;