import { MailService } from '@sendgrid/mail';
import { User } from '../../shared/schema';
import crypto from 'crypto';

if (!process.env.SENDGRID_API_KEY) {
  console.error(`Error: SENDGRID_API_KEY environment variable is not set in ${process.env.NODE_ENV || 'current'} environment`);
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

if (!process.env.SITE_URL) {
  console.warn("Warning: SITE_URL environment variable is not set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);
console.log('SendGrid API key configured successfully');

const FROM_EMAIL = 'noreply@homesbin.com';

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

export class EmailService {
  private static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static async sendVerificationEmail(userEmail: string, verificationToken: string): Promise<boolean> {
    console.log(`[Email Service] Attempting to send verification email to: ${userEmail}`);
    const siteUrl = process.env.SITE_URL || 'https://homesbin.com';
    const verificationLink = `${siteUrl}/verify-email?token=${verificationToken}`;
    console.log('[Email Service] Generated verification link:', verificationLink);

    const template: EmailTemplate = {
      subject: 'Verify your HomesBin account',
      text: `Welcome to HomesBin! Please verify your email to access all of our tools: ${verificationLink}`,
      html: `
        <h1>Welcome to HomesBin!</h1>
        <p>Thank you for signing up. Please verify your email address to receive your 5 free tokens by clicking the link below:</p>
        <p><a href="${verificationLink}">Verify Email Address</a></p>
        <p>If you didn't create this account, you can safely ignore this email.</p>
      `
    };

    return this.sendEmail(userEmail, template);
  }

  static async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<boolean> {
    console.log(`Attempting to send password reset email to: ${userEmail}`);
    const siteUrl = process.env.SITE_URL || 'https://homesbin.com';
    const resetLink = `${siteUrl}/reset-password?token=${resetToken}`;
    console.log('Generated password reset link:', resetLink);

    const template: EmailTemplate = {
      subject: 'Reset your HomesBin password',
      text: `Click this link to reset your password: ${resetLink}. If you didn't request this, please ignore this email.`,
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>If you didn't request this change, you can safely ignore this email.</p>
      `
    };

    return this.sendEmail(userEmail, template);
  }

  static async sendWelcomeEmail(userEmail: string): Promise<boolean> {
    console.log(`Attempting to send welcome email to: ${userEmail}`);
    const siteUrl = process.env.SITE_URL || 'https://homesbin.com';

    const template: EmailTemplate = {
      subject: 'Welcome to HomesBin!',
      text: `Welcome to HomesBin! We're excited to take your marketing to the next level.`,
      html: `
        <h1>Welcome to HomesBin!</h1>
        <p>We're excited to have you on board!</p>
        <p>With HomesBin, you can:</p>
        <ul>
          <li>Create professional listing pages</li>
          <li>Send tailored marketing emails</li>
          <li>Generate lot maps for developements</li>
        </ul>
        <p>Get started by visiting your <a href="${siteUrl}/dashboard">dashboard</a>.</p>
      `
    };

    return this.sendEmail(userEmail, template);
  }

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
        from: FROM_EMAIL,
        subject: template.subject,
        text: template.text,
        html: template.html,
      };

      const response = await mailService.send(msg);
      console.log('[Email Service] SendGrid API Response:', response);
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