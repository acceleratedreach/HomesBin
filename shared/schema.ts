import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  profileImage: text("profile_image"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  emailVerified: true,
  verificationToken: true,
  createdAt: true,
});

// Property listing model
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  price: integer("price").notNull(),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  squareFeet: integer("square_feet"),
  description: text("description"),
  propertyType: text("property_type"),
  images: text("images").array(),
  features: jsonb("features"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  status: text("status").default("active"),
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Marketing email templates
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
});

// Social media content
export const socialContent = pgTable("social_content", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  listingId: integer("listing_id").references(() => listings.id),
  contentType: text("content_type").notNull(), // post, story, etc.
  content: text("content").notNull(),
  image: text("image"),
  platform: text("platform").notNull(), // facebook, instagram, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSocialContentSchema = createInsertSchema(socialContent).omit({
  id: true,
  createdAt: true,
});

// Connected social accounts
export const socialAccounts = pgTable("social_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  platform: text("platform").notNull(),
  accountId: text("account_id").notNull(),
  accountUsername: text("account_username"),
  accessToken: text("access_token"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
  createdAt: true,
});

// User notification preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  newLeadNotifications: boolean("new_lead_notifications").default(true),
  listingUpdates: boolean("listing_updates").default(true),
  marketingEmails: boolean("marketing_emails").default(false),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Listing = typeof listings.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

export type SocialContent = typeof socialContent.$inferSelect;
export type InsertSocialContent = z.infer<typeof insertSocialContentSchema>;

export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferencesSchema>;
