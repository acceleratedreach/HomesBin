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
} from "@shared/schema";
import crypto from "crypto";

// Storage interface for CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  verifyEmail(token: string): Promise<boolean>;
  generateVerificationToken(userId: number): Promise<string>;

  // Listing operations
  getListing(id: number): Promise<Listing | undefined>;
  getListingsByUserId(userId: number): Promise<Listing[]>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: number, listingData: Partial<Listing>): Promise<Listing | undefined>;
  deleteListing(id: number): Promise<boolean>;

  // Email template operations
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  getEmailTemplatesByUserId(userId: number): Promise<EmailTemplate[]>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, templateData: Partial<EmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;

  // Social content operations
  getSocialContent(id: number): Promise<SocialContent | undefined>;
  getSocialContentByUserId(userId: number): Promise<SocialContent[]>;
  createSocialContent(content: InsertSocialContent): Promise<SocialContent>;
  deleteSocialContent(id: number): Promise<boolean>;

  // Social account operations
  getSocialAccountsByUserId(userId: number): Promise<SocialAccount[]>;
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  deleteSocialAccount(id: number): Promise<boolean>;

  // Notification preferences operations
  getNotificationPreferences(userId: number): Promise<NotificationPreference | undefined>;
  createNotificationPreferences(preferences: InsertNotificationPreference): Promise<NotificationPreference>;
  updateNotificationPreferences(userId: number, preferencesData: Partial<NotificationPreference>): Promise<NotificationPreference | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private listings: Map<number, Listing>;
  private emailTemplates: Map<number, EmailTemplate>;
  private socialContent: Map<number, SocialContent>;
  private socialAccounts: Map<number, SocialAccount>;
  private notificationPreferences: Map<number, NotificationPreference>;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.listings = new Map();
    this.emailTemplates = new Map();
    this.socialContent = new Map();
    this.socialAccounts = new Map();
    this.notificationPreferences = new Map();
    this.currentId = {
      users: 1,
      listings: 1,
      emailTemplates: 1,
      socialContent: 1,
      socialAccounts: 1,
      notificationPreferences: 1
    };
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const user: User = {
      ...insertUser,
      id,
      emailVerified: false,
      verificationToken,
      createdAt: new Date()
    };
    this.users.set(id, user);
    
    // Create default notification preferences for new users
    await this.createNotificationPreferences({
      userId: id,
      newLeadNotifications: true,
      listingUpdates: true,
      marketingEmails: false
    });
    
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const user = Array.from(this.users.values()).find(
      (user) => user.verificationToken === token
    );

    if (!user) return false;

    const updatedUser = {
      ...user,
      emailVerified: true,
      verificationToken: null
    };
    this.users.set(user.id, updatedUser);
    return true;
  }

  async generateVerificationToken(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const token = crypto.randomBytes(20).toString('hex');
    const updatedUser = {
      ...user,
      verificationToken: token
    };
    this.users.set(userId, updatedUser);
    return token;
  }

  // Listing operations
  async getListing(id: number): Promise<Listing | undefined> {
    return this.listings.get(id);
  }

  async getListingsByUserId(userId: number): Promise<Listing[]> {
    return Array.from(this.listings.values()).filter(
      (listing) => listing.userId === userId
    );
  }

  async createListing(insertListing: InsertListing): Promise<Listing> {
    const id = this.currentId.listings++;
    const now = new Date();
    const listing: Listing = {
      ...insertListing,
      id,
      createdAt: now,
      updatedAt: now,
      status: "active"
    };
    this.listings.set(id, listing);
    return listing;
  }

  async updateListing(id: number, listingData: Partial<Listing>): Promise<Listing | undefined> {
    const listing = await this.getListing(id);
    if (!listing) return undefined;

    const updatedListing = {
      ...listing,
      ...listingData,
      updatedAt: new Date()
    };
    this.listings.set(id, updatedListing);
    return updatedListing;
  }

  async deleteListing(id: number): Promise<boolean> {
    const deleted = this.listings.delete(id);
    return deleted;
  }

  // Email template operations
  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }

  async getEmailTemplatesByUserId(userId: number): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values()).filter(
      (template) => template.userId === userId
    );
  }

  async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = this.currentId.emailTemplates++;
    const template: EmailTemplate = {
      ...insertTemplate,
      id,
      createdAt: new Date()
    };
    this.emailTemplates.set(id, template);
    return template;
  }

  async updateEmailTemplate(id: number, templateData: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    const template = await this.getEmailTemplate(id);
    if (!template) return undefined;

    const updatedTemplate = { ...template, ...templateData };
    this.emailTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    const deleted = this.emailTemplates.delete(id);
    return deleted;
  }

  // Social content operations
  async getSocialContent(id: number): Promise<SocialContent | undefined> {
    return this.socialContent.get(id);
  }

  async getSocialContentByUserId(userId: number): Promise<SocialContent[]> {
    return Array.from(this.socialContent.values()).filter(
      (content) => content.userId === userId
    );
  }

  async createSocialContent(insertContent: InsertSocialContent): Promise<SocialContent> {
    const id = this.currentId.socialContent++;
    const content: SocialContent = {
      ...insertContent,
      id,
      createdAt: new Date()
    };
    this.socialContent.set(id, content);
    return content;
  }

  async deleteSocialContent(id: number): Promise<boolean> {
    const deleted = this.socialContent.delete(id);
    return deleted;
  }

  // Social account operations
  async getSocialAccountsByUserId(userId: number): Promise<SocialAccount[]> {
    return Array.from(this.socialAccounts.values()).filter(
      (account) => account.userId === userId
    );
  }

  async createSocialAccount(insertAccount: InsertSocialAccount): Promise<SocialAccount> {
    const id = this.currentId.socialAccounts++;
    const account: SocialAccount = {
      ...insertAccount,
      id,
      createdAt: new Date()
    };
    this.socialAccounts.set(id, account);
    return account;
  }

  async deleteSocialAccount(id: number): Promise<boolean> {
    const deleted = this.socialAccounts.delete(id);
    return deleted;
  }

  // Notification preferences operations
  async getNotificationPreferences(userId: number): Promise<NotificationPreference | undefined> {
    return Array.from(this.notificationPreferences.values()).find(
      (pref) => pref.userId === userId
    );
  }

  async createNotificationPreferences(insertPreferences: InsertNotificationPreference): Promise<NotificationPreference> {
    const id = this.currentId.notificationPreferences++;
    const preferences: NotificationPreference = {
      ...insertPreferences,
      id
    };
    this.notificationPreferences.set(id, preferences);
    return preferences;
  }

  async updateNotificationPreferences(userId: number, preferencesData: Partial<NotificationPreference>): Promise<NotificationPreference | undefined> {
    const preferences = await this.getNotificationPreferences(userId);
    if (!preferences) return undefined;

    const updatedPreferences = { ...preferences, ...preferencesData };
    this.notificationPreferences.set(preferences.id, updatedPreferences);
    return updatedPreferences;
  }
}

export const storage = new MemStorage();
