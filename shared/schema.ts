import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
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

// Lot map model
export const lots = pgTable("lots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  mapId: integer("map_id").notNull().references(() => mapSettings.id),
  number: text("number").notNull(),
  status: text("status").notNull().default("available"),
  price: integer("price").notNull(),
  sqft: integer("sqft").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: real("bathrooms").notNull(),
  description: text("description"),
  imageUrls: text("image_urls").array(),
  svgPath: text("svg_path").notNull(),
  amenities: text("amenities").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Map settings model
export const mapSettings = pgTable("map_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  backgroundImage: text("background_image"),
  slug: text("slug").notNull().unique(),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLotSchema = z.object({
  userId: z.number().optional(),
  mapId: z.number().optional(),
  number: z.string(),
  status: z.string().default("available"),
  price: z.number().int().positive(),
  sqft: z.number().int().positive(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().positive(),
  description: z.string().optional(),
  imageUrls: z.array(z.string()).optional().default([]),
  svgPath: z.string(),
  amenities: z.array(z.string()).optional().default([]),
});

export const updateLotSchema = insertLotSchema.partial().extend({
  id: z.number(),
});

export const insertMapSettingsSchema = z.object({
  userId: z.number().optional(),
  name: z.string().min(1, "Map name is required"),
  description: z.string().optional(),
  backgroundImage: z.string().optional(),
  slug: z.string().optional(),
  isPublic: z.boolean().optional().default(true),
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

// User theme settings
export const userThemes = pgTable("user_themes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  templateId: text("template_id").notNull().default("professional"),
  primaryColor: text("primary_color").notNull().default("#4f46e5"),
  colorMode: text("color_mode").notNull().default("light"),
  fontFamily: text("font_family").notNull().default("Inter"),
  fontSize: integer("font_size").notNull().default(16),
  borderRadius: integer("border_radius").notNull().default(8),
  customCss: text("custom_css"),
  headerLayout: text("header_layout").notNull().default("standard"),
  featuredListingsLayout: text("featured_listings_layout").notNull().default("grid"),
  contactFormEnabled: boolean("contact_form_enabled").default(true),
  socialLinksEnabled: boolean("social_links_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserTheme = typeof userThemes.$inferSelect;
export type InsertUserTheme = typeof userThemes.$inferInsert;

export const insertUserThemeSchema = createInsertSchema(userThemes);
export const selectUserThemeSchema = z.object({
  id: z.number(),
  userId: z.number(),
  templateId: z.string(),
  primaryColor: z.string(),
  colorMode: z.string(),
  fontFamily: z.string(),
  fontSize: z.number(),
  borderRadius: z.number(),
  customCss: z.string().optional(),
  headerLayout: z.string(),
  featuredListingsLayout: z.string(),
  contactFormEnabled: z.boolean(),
  socialLinksEnabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Listing = typeof listings.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;

export type Lot = typeof lots.$inferSelect;
export type InsertLot = z.infer<typeof insertLotSchema>;
export type UpdateLot = z.infer<typeof updateLotSchema>;

export type MapSettings = typeof mapSettings.$inferSelect;
export type InsertMapSettings = z.infer<typeof insertMapSettingsSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

export type SocialContent = typeof socialContent.$inferSelect;
export type InsertSocialContent = z.infer<typeof insertSocialContentSchema>;

export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferencesSchema>;
