import { eq } from 'drizzle-orm';
import { db } from './db';
import crypto from 'crypto';
import {
  users,
  type User,
  type InsertUser,
  listings,
  type Listing,
  type InsertListing,
  emailTemplates,
  type EmailTemplate,
  type InsertEmailTemplate,
  socialContent,
  type SocialContent,
  type InsertSocialContent,
  socialAccounts,
  type SocialAccount,
  type InsertSocialAccount,
  notificationPreferences,
  type NotificationPreference,
  type InsertNotificationPreference
} from '@shared/schema';
import { IStorage } from './storage';

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const verificationToken = crypto.randomBytes(20).toString('hex');
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        emailVerified: false,
        verificationToken
      })
      .returning();
    
    // Create default notification preferences for new users
    await this.createNotificationPreferences({
      userId: user.id,
      newLeadNotifications: true,
      listingUpdates: true,
      marketingEmails: false
    });
    
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token));
      
    if (!user) return false;
    
    await db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null
      })
      .where(eq(users.id, user.id));
      
    return true;
  }

  async generateVerificationToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(20).toString('hex');
    
    await db
      .update(users)
      .set({ verificationToken: token })
      .where(eq(users.id, userId));
    
    return token;
  }

  // Listing operations
  async getListing(id: number): Promise<Listing | undefined> {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing;
  }

  async getListingsByUserId(userId: number): Promise<Listing[]> {
    return db.select().from(listings).where(eq(listings.userId, userId));
  }

  async createListing(insertListing: InsertListing): Promise<Listing> {
    const now = new Date();
    
    const [listing] = await db
      .insert(listings)
      .values({
        ...insertListing,
        createdAt: now,
        updatedAt: now,
        status: "active"
      })
      .returning();
      
    return listing;
  }

  async updateListing(id: number, listingData: Partial<Listing>): Promise<Listing | undefined> {
    const [updatedListing] = await db
      .update(listings)
      .set({
        ...listingData,
        updatedAt: new Date()
      })
      .where(eq(listings.id, id))
      .returning();
      
    return updatedListing;
  }

  async deleteListing(id: number): Promise<boolean> {
    const result = await db
      .delete(listings)
      .where(eq(listings.id, id))
      .returning({ id: listings.id });
      
    return result.length > 0;
  }

  // Email template operations
  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template;
  }

  async getEmailTemplatesByUserId(userId: number): Promise<EmailTemplate[]> {
    return db.select().from(emailTemplates).where(eq(emailTemplates.userId, userId));
  }

  async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const [template] = await db
      .insert(emailTemplates)
      .values(insertTemplate)
      .returning();
      
    return template;
  }

  async updateEmailTemplate(id: number, templateData: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(emailTemplates)
      .set(templateData)
      .where(eq(emailTemplates.id, id))
      .returning();
      
    return updatedTemplate;
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    const result = await db
      .delete(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .returning({ id: emailTemplates.id });
      
    return result.length > 0;
  }

  // Social content operations
  async getSocialContent(id: number): Promise<SocialContent | undefined> {
    const [content] = await db.select().from(socialContent).where(eq(socialContent.id, id));
    return content;
  }

  async getSocialContentByUserId(userId: number): Promise<SocialContent[]> {
    return db.select().from(socialContent).where(eq(socialContent.userId, userId));
  }

  async createSocialContent(insertContent: InsertSocialContent): Promise<SocialContent> {
    const [content] = await db
      .insert(socialContent)
      .values(insertContent)
      .returning();
      
    return content;
  }

  async deleteSocialContent(id: number): Promise<boolean> {
    const result = await db
      .delete(socialContent)
      .where(eq(socialContent.id, id))
      .returning({ id: socialContent.id });
      
    return result.length > 0;
  }

  // Social account operations
  async getSocialAccountsByUserId(userId: number): Promise<SocialAccount[]> {
    return db.select().from(socialAccounts).where(eq(socialAccounts.userId, userId));
  }

  async createSocialAccount(insertAccount: InsertSocialAccount): Promise<SocialAccount> {
    const [account] = await db
      .insert(socialAccounts)
      .values(insertAccount)
      .returning();
      
    return account;
  }

  async deleteSocialAccount(id: number): Promise<boolean> {
    const result = await db
      .delete(socialAccounts)
      .where(eq(socialAccounts.id, id))
      .returning({ id: socialAccounts.id });
      
    return result.length > 0;
  }

  // Notification preferences operations
  async getNotificationPreferences(userId: number): Promise<NotificationPreference | undefined> {
    const [preferences] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
      
    return preferences;
  }

  async createNotificationPreferences(insertPreferences: InsertNotificationPreference): Promise<NotificationPreference> {
    const [preferences] = await db
      .insert(notificationPreferences)
      .values(insertPreferences)
      .returning();
      
    return preferences;
  }

  async updateNotificationPreferences(
    userId: number,
    preferencesData: Partial<NotificationPreference>
  ): Promise<NotificationPreference | undefined> {
    const [preferences] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
    
    if (!preferences) return undefined;
    
    const [updatedPreferences] = await db
      .update(notificationPreferences)
      .set(preferencesData)
      .where(eq(notificationPreferences.id, preferences.id))
      .returning();
    
    return updatedPreferences;
  }
}