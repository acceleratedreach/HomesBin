import { Express, Request, Response } from 'express';
import { IStorage } from '../storage';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { MailService } from '@sendgrid/mail';
import { User } from '@shared/schema';

// Initialize SendGrid
const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid API key configured successfully');
} else {
  console.error('Warning: SENDGRID_API_KEY environment variable is not set');
}

// Email templates
const getVerificationEmailTemplate = (token: string) => {
  const verificationUrl = `${process.env.SITE_URL || 'https://homesbin.com'}/verify-email?token=${token}`;
  
  return {
    subject: 'Verify your HomesBin account',
    text: `Welcome to HomesBin! Please verify your email address by clicking this link: ${verificationUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a6cf7;">Welcome to HomesBin!</h2>
        <p>Thank you for signing up. Please verify your email address to access all features.</p>
        <p>
          <a href="${verificationUrl}" style="display: inline-block; background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Verify Email Address
          </a>
        </p>
        <p>Or copy and paste this link in your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `
  };
};

const getPasswordResetTemplate = (token: string) => {
  const resetUrl = `${process.env.SITE_URL || 'https://homesbin.com'}/reset-password?token=${token}`;
  
  return {
    subject: 'Reset your HomesBin password',
    text: `You requested to reset your password. Click this link to create a new password: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a6cf7;">Reset Your Password</h2>
        <p>You've requested to reset your password. Click the button below to create a new password.</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this link in your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `
  };
};

const getWelcomeEmailTemplate = (user: User) => {
  return {
    subject: 'Welcome to HomesBin!',
    text: `Hi ${user.fullName || user.username}, Thank you for joining HomesBin! We're excited to have you on board.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a6cf7;">Welcome to HomesBin!</h2>
        <p>Hi ${user.fullName || user.username},</p>
        <p>Thank you for joining HomesBin! We're excited to have you on board.</p>
        <p>With HomesBin, you can:</p>
        <ul>
          <li>Create and manage your property listings</li>
          <li>Generate social media content for your properties</li>
          <li>Send marketing emails to potential clients</li>
          <li>Track property interest and engagement</li>
        </ul>
        <p>Get started by adding your first property listing!</p>
        <p>
          <a href="${process.env.SITE_URL || 'https://homesbin.com'}/${user.username}/listings/new" style="display: inline-block; background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Create Your First Listing
          </a>
        </p>
        <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
        <p>Best regards,<br>The HomesBin Team</p>
      </div>
    `
  };
};

// Helper function to send emails
const sendEmail = async (to: string, subject: string, text: string, html: string): Promise<boolean> => {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('Error: SENDGRID_API_KEY is not set');
    return false;
  }

  try {
    await mailService.send({
      to,
      from: {
        email: 'noreply@homesbin.com',
        name: 'HomesBin'
      },
      subject,
      text,
      html
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
};

// Password reset tokens with expiration
const passwordResetTokens = new Map<string, { userId: number, expires: Date }>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = new Date();
  for (const [token, { expires }] of passwordResetTokens.entries()) {
    if (expires < now) {
      passwordResetTokens.delete(token);
    }
  }
}, 60 * 60 * 1000); // Run every hour

export function registerEmailRoutes(app: Express, storage: IStorage) {
  // Send email verification
  app.post('/api/user/verify-email/send', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = req.user as any;
      if (user.emailVerified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }

      // Generate verification token
      const token = await storage.generateVerificationToken(user.id);
      
      // Send verification email
      const template = getVerificationEmailTemplate(token);
      const emailSent = await sendEmail(
        user.email,
        template.subject,
        template.text,
        template.html
      );

      if (emailSent) {
        res.status(200).json({ message: 'Verification email sent' });
      } else {
        res.status(500).json({ message: 'Failed to send verification email' });
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Verify email with token
  app.get('/api/user/verify-email', async (req: Request, res: Response) => {
    try {
      const tokenSchema = z.object({
        token: z.string()
      });
      
      const result = tokenSchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid token' });
      }

      const { token } = result.data;
      const verified = await storage.verifyEmail(token);
      
      if (verified) {
        res.status(200).json({ message: 'Email verified successfully' });
      } else {
        res.status(400).json({ message: 'Invalid or expired token' });
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Request password reset
  app.post('/api/user/forgot-password', async (req: Request, res: Response) => {
    try {
      const emailSchema = z.object({
        email: z.string().email()
      });
      
      const result = emailSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid email' });
      }

      const { email } = result.data;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal whether a user exists for security reasons
        return res.status(200).json({ message: 'If your email exists in our system, you will receive a password reset link' });
      }

      // Generate reset token
      const token = randomBytes(32).toString('hex');
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // Token valid for 1 hour
      
      passwordResetTokens.set(token, { userId: user.id, expires });

      // Send password reset email
      const template = getPasswordResetTemplate(token);
      const emailSent = await sendEmail(
        email,
        template.subject,
        template.text,
        template.html
      );

      if (emailSent) {
        res.status(200).json({ message: 'If your email exists in our system, you will receive a password reset link' });
      } else {
        res.status(500).json({ message: 'Failed to send password reset email' });
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Reset password with token
  app.post('/api/user/reset-password', async (req: Request, res: Response) => {
    try {
      const resetSchema = z.object({
        token: z.string(),
        password: z.string().min(8)
      });
      
      const result = resetSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid input' });
      }

      const { token, password } = result.data;
      const resetInfo = passwordResetTokens.get(token);
      
      if (!resetInfo || resetInfo.expires < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      const user = await storage.getUser(resetInfo.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await storage.updateUser(user.id, { password: hashedPassword });
      
      // Delete the used token
      passwordResetTokens.delete(token);

      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Welcome email (admin only)
  app.post('/api/user/welcome-email/:userId', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const adminUser = req.user as any;
      // This should be expanded with proper admin role checking
      if (adminUser.id !== 1) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Send welcome email
      const template = getWelcomeEmailTemplate(user);
      const emailSent = await sendEmail(
        user.email,
        template.subject,
        template.text,
        template.html
      );

      if (emailSent) {
        res.status(200).json({ message: 'Welcome email sent' });
      } else {
        res.status(500).json({ message: 'Failed to send welcome email' });
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
}