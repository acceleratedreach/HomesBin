import crypto from 'crypto';
import { IStorage } from '../storage';
import { User } from '../../shared/schema';
import { EmailService } from './emailService';

// Store tokens in memory with expiration times
const resetTokens = new Map<string, { userId: number, expires: Date }>();

export class PasswordResetService {
  constructor(private storage: IStorage) {}

  /**
   * Generate a password reset token for a user
   * @param email User's email address
   * @returns The reset token or null if user not found
   */
  async generateResetToken(email: string): Promise<string | null> {
    const user = await this.storage.getUserByEmail(email);
    if (!user) {
      return null;
    }

    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration time (1 hour from now)
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    
    // Store token with user ID and expiration
    resetTokens.set(token, { 
      userId: user.id, 
      expires 
    });
    
    // Send the password reset email
    await EmailService.sendPasswordResetEmail(email, token);
    
    return token;
  }

  /**
   * Validate a password reset token
   * @param token The reset token to validate
   * @returns The associated user if token is valid, null otherwise
   */
  async validateResetToken(token: string): Promise<User | null> {
    const tokenData = resetTokens.get(token);
    
    // Token doesn't exist
    if (!tokenData) {
      return null;
    }
    
    // Token has expired
    if (new Date() > tokenData.expires) {
      resetTokens.delete(token);
      return null;
    }
    
    // Get the associated user
    const user = await this.storage.getUser(tokenData.userId);
    return user || null;
  }

  /**
   * Reset a user's password using a valid token
   * @param token The reset token
   * @param newPassword The new password
   * @returns True if password was reset successfully
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await this.validateResetToken(token);
    
    if (!user) {
      return false;
    }
    
    // Update the user's password
    const updatedUser = await this.storage.updateUser(user.id, { 
      password: newPassword 
    });
    
    // Remove the used token
    resetTokens.delete(token);
    
    return !!updatedUser;
  }

  /**
   * Delete expired tokens (called periodically)
   */
  cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [token, data] of resetTokens.entries()) {
      if (now > data.expires) {
        resetTokens.delete(token);
      }
    }
  }
}