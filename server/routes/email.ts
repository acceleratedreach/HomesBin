import { Express, Request, Response } from 'express';
import { IStorage } from '../storage';
import { EmailService } from '../services/emailService';
import { PasswordResetService } from '../services/passwordResetService';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email()
});

const verifyTokenSchema = z.object({
  token: z.string().min(1)
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8)
});

export function registerEmailRoutes(app: Express, storage: IStorage) {
  const passwordResetService = new PasswordResetService(storage);

  // Cleanup expired tokens periodically (every hour)
  setInterval(() => {
    passwordResetService.cleanupExpiredTokens();
  }, 60 * 60 * 1000);

  // Send verification email
  app.post('/api/auth/send-verification', async (req: Request, res: Response) => {
    try {
      const user: any = req.user;
      
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      if (user.emailVerified) {
        return res.status(400).json({ message: 'Email already verified' });
      }
      
      const token = await storage.generateVerificationToken(user.id);
      const success = await EmailService.sendVerificationEmail(user.email, token);
      
      if (success) {
        return res.json({ message: 'Verification email sent' });
      } else {
        return res.status(500).json({ message: 'Failed to send verification email' });
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Verify email with token
  app.post('/api/auth/verify-email', async (req: Request, res: Response) => {
    try {
      const validatedData = verifyTokenSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: 'Invalid token' });
      }
      
      const { token } = validatedData.data;
      const success = await storage.verifyEmail(token);
      
      if (success) {
        return res.json({ message: 'Email verified successfully' });
      } else {
        return res.status(400).json({ message: 'Invalid or expired verification token' });
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Request password reset
  app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    try {
      const validatedData = emailSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: 'Invalid email address' });
      }
      
      const { email } = validatedData.data;
      const token = await passwordResetService.generateResetToken(email);
      
      // Always return success to prevent user enumeration
      return res.json({ 
        message: 'If your email is registered, you will receive a password reset link shortly' 
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Reset password with token
  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const validatedData = resetPasswordSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: 'Invalid data. Password must be at least 8 characters.' 
        });
      }
      
      const { token, password } = validatedData.data;
      const success = await passwordResetService.resetPassword(token, password);
      
      if (success) {
        return res.json({ message: 'Password reset successful' });
      } else {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
}