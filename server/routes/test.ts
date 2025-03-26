import { Express, Request, Response } from 'express';
import { IStorage } from '../storage';
import { randomBytes } from 'crypto';
import { MailService } from '@sendgrid/mail';

// Initialize SendGrid
const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid API key configured for test routes');
} else {
  console.error('Warning: SENDGRID_API_KEY environment variable is not set for test routes');
}

// Helper function to send test email
const sendTestEmail = async (to: string): Promise<boolean> => {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('Error: SENDGRID_API_KEY is not set');
    return false;
  }

  try {
    await mailService.send({
      to,
      from: {
        email: 'noreply@homesbin.com',
        name: 'HomesBin Test'
      },
      subject: 'HomesBin Test Email',
      text: `This is a test email sent from HomesBin at ${new Date().toISOString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a6cf7;">HomesBin Test Email</h2>
          <p>This is a test email sent from HomesBin.</p>
          <p>Time sent: ${new Date().toLocaleString()}</p>
          <p>Your email is working correctly if you received this message.</p>
          <p>This is a system test and no action is required.</p>
        </div>
      `,
      trackingSettings: {
        clickTracking: {
          enable: false
        },
        openTracking: {
          enable: true
        }
      }
    });
    console.log(`Test email sent successfully to: ${to}`);
    return true;
  } catch (error) {
    console.error('SendGrid test email error:', error);
    return false;
  }
};

export function registerTestRoutes(app: Express, storage: IStorage) {
  // Test email route - only in development
  if (process.env.NODE_ENV !== 'production') {
    app.get('/api/test/email/:email', async (req: Request, res: Response) => {
      try {
        const email = req.params.email;
        if (!email || !email.includes('@')) {
          return res.status(400).json({ message: 'Invalid email address' });
        }
        
        const emailSent = await sendTestEmail(email);
        
        if (emailSent) {
          res.status(200).json({ message: `Test email sent to ${email}` });
        } else {
          res.status(500).json({ message: 'Failed to send test email' });
        }
      } catch (error) {
        console.error('Error in test email route:', error);
        res.status(500).json({ message: 'Server error' });
      }
    });
    
    // Test route to check session status
    app.get('/api/test/session', (req: Request, res: Response) => {
      if (req.isAuthenticated()) {
        const user = req.user as any;
        return res.json({
          authenticated: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            emailVerified: user.emailVerified
          }
        });
      } else {
        return res.json({
          authenticated: false,
          message: "Not authenticated"
        });
      }
    });
  }
}