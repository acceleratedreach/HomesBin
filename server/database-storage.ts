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
  type InsertNotificationPreference,
  userThemes,
  type UserTheme,
  type InsertUserTheme,
  lots,
  type Lot,
  type InsertLot,
  type UpdateLot,
  mapSettings,
  type MapSettings,
  type InsertMapSettings
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

  // Theme operations
  async getUserTheme(userId: number): Promise<UserTheme | undefined> {
    const [theme] = await db
      .select()
      .from(userThemes)
      .where(eq(userThemes.userId, userId));
      
    return theme;
  }
  
  async createUserTheme(themeData: InsertUserTheme): Promise<UserTheme> {
    const now = new Date();
    
    const [theme] = await db
      .insert(userThemes)
      .values({
        ...themeData,
        createdAt: now,
        updatedAt: now
      })
      .returning();
      
    return theme;
  }
  
  async updateUserTheme(userId: number, themeData: Partial<UserTheme>): Promise<UserTheme | undefined> {
    const [existingTheme] = await db
      .select()
      .from(userThemes)
      .where(eq(userThemes.userId, userId));
    
    // If no theme exists, create a default one with updates applied
    if (!existingTheme) {
      return this.createUserTheme({
        userId,
        templateId: themeData.templateId || 'professional',
        primaryColor: themeData.primaryColor || '#4f46e5',
        colorMode: themeData.colorMode || 'light',
        fontFamily: themeData.fontFamily || 'Inter',
        fontSize: themeData.fontSize || 16,
        borderRadius: themeData.borderRadius || 8,
        customCss: themeData.customCss,
        headerLayout: themeData.headerLayout || 'standard',
        featuredListingsLayout: themeData.featuredListingsLayout || 'grid',
        contactFormEnabled: themeData.contactFormEnabled ?? true,
        socialLinksEnabled: themeData.socialLinksEnabled ?? true
      });
    }
    
    const [updatedTheme] = await db
      .update(userThemes)
      .set({
        ...themeData,
        updatedAt: new Date()
      })
      .where(eq(userThemes.id, existingTheme.id))
      .returning();
      
    return updatedTheme;
  }
  
  // Lot map functions
  async getLots(mapId?: number): Promise<Lot[]> {
    if (mapId) {
      return db.select().from(lots).where(eq(lots.mapId, mapId));
    }
    return db.select().from(lots);
  }
  
  async getLot(id: number): Promise<Lot | null> {
    const [lot] = await db.select().from(lots).where(eq(lots.id, id));
    return lot || null;
  }
  
  async searchLots(query: string): Promise<Lot[]> {
    // Basic search by lot number
    return db.select().from(lots).where(
      lots.number.toString().toLowerCase().includes(query.toLowerCase())
    );
  }
  
  async filterLots(filters: {
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    minSqft?: number;
    maxSqft?: number;
  }): Promise<Lot[]> {
    // Basic implementation - in a real app, you'd use more sophisticated filtering
    let query = db.select().from(lots);
    
    if (filters.status) {
      query = query.where(eq(lots.status, filters.status));
    }
    
    // Execute query and then filter in-memory for simplicity
    // In production, you'd use SQL filtering for all of these
    const results = await query;
    
    return results.filter(lot => {
      if (filters.minPrice && lot.price < filters.minPrice) return false;
      if (filters.maxPrice && lot.price > filters.maxPrice) return false;
      if (filters.minSqft && lot.sqft < filters.minSqft) return false;
      if (filters.maxSqft && lot.sqft > filters.maxSqft) return false;
      return true;
    });
  }
  
  async createLot(data: InsertLot): Promise<Lot> {
    const now = new Date();
    
    const [lot] = await db
      .insert(lots)
      .values({
        ...data,
        createdAt: now,
        updatedAt: now
      })
      .returning();
      
    return lot;
  }
  
  async updateLot(data: UpdateLot): Promise<Lot> {
    const [updatedLot] = await db
      .update(lots)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(lots.id, data.id))
      .returning();
      
    return updatedLot;
  }
  
  async deleteLot(id: number): Promise<void> {
    await db
      .delete(lots)
      .where(eq(lots.id, id));
  }
  
  // Map Settings functions
  async getMapSettings(slug?: string): Promise<MapSettings[]> {
    if (slug) {
      return db.select().from(mapSettings).where(eq(mapSettings.slug, slug));
    }
    return db.select().from(mapSettings);
  }
  
  async getMapSettingsById(id: number): Promise<MapSettings | null> {
    const [settings] = await db.select().from(mapSettings).where(eq(mapSettings.id, id));
    return settings || null;
  }
  
  async createMapSettings(data: InsertMapSettings): Promise<MapSettings> {
    const now = new Date();
    
    const [settings] = await db
      .insert(mapSettings)
      .values({
        ...data,
        createdAt: now,
        updatedAt: now
      })
      .returning();
      
    return settings;
  }
  
  async updateMapSettings(data: InsertMapSettings & { id?: number }): Promise<MapSettings> {
    if (!data.id) {
      throw new Error('ID is required for updating map settings');
    }
    
    const [updatedSettings] = await db
      .update(mapSettings)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(mapSettings.id, data.id))
      .returning();
      
    return updatedSettings;
  }
  
  async deleteMapSettings(id: number): Promise<void> {
    await db
      .delete(mapSettings)
      .where(eq(mapSettings.id, id));
  }
  
  async getUserMapSettings(userId: number): Promise<MapSettings[]> {
    return db.select().from(mapSettings).where(eq(mapSettings.userId, userId));
  }
}