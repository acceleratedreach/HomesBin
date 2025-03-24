import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertListingSchema, 
  insertEmailTemplateSchema, 
  insertSocialContentSchema,
  insertSocialAccountSchema,
  insertNotificationPreferencesSchema
} from "@shared/schema";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { registerEmailRoutes } from "./routes/email";
import { registerMarketingRoutes } from "./routes/marketing";
import { EmailService } from "./services/emailService";

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "homesbinsecret",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Passport setup
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Try to find the user by username first
        let user = await storage.getUserByUsername(username);
        
        // If not found, try by email
        if (!user) {
          user = await storage.getUserByEmail(username);
        }
        
        if (!user) {
          return done(null, false, { message: "Incorrect username or email" });
        }

        // Check password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // AUTH ROUTES
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create new user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Generate verification token
      const verificationToken = await storage.generateVerificationToken(user.id);
      
      // Send verification email
      try {
        await EmailService.sendVerificationEmail(user.email, verificationToken);
        console.log(`Verification email sent to: ${user.email}`);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // We'll continue even if email sending fails
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        return res.status(201).json({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            emailVerified: user.emailVerified,
            fullName: user.fullName
          }
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    const user: any = req.user;
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        fullName: user.fullName
      }
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.isAuthenticated()) {
      const user: any = req.user;
      return res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          emailVerified: user.emailVerified,
          fullName: user.fullName
        }
      });
    }
    return res.status(401).json({ message: "Not authenticated" });
  });

  // USER ROUTES
  app.get("/api/user", isAuthenticated, async (req, res) => {
    const user: any = req.user;
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      fullName: user.fullName,
      profileImage: user.profileImage
    });
  });

  app.patch("/api/user", isAuthenticated, async (req, res) => {
    try {
      const user: any = req.user;
      
      // Only allow updating certain fields
      const allowedFields = ["username", "email", "fullName", "profileImage"];
      const updateData: any = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      
      // If updating username or email, check if it's already taken
      if (updateData.username && updateData.username !== user.username) {
        const existingUser = await storage.getUserByUsername(updateData.username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }
      
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await storage.getUserByEmail(updateData.email);
        if (existingUser) {
          return res.status(400).json({ message: "Email already taken" });
        }
        // If email is changed, set emailVerified to false and generate a new token
        updateData.emailVerified = false;
        updateData.verificationToken = crypto.randomBytes(20).toString('hex');
      }
      
      const updatedUser = await storage.updateUser(user.id, updateData);
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        emailVerified: updatedUser.emailVerified,
        fullName: updatedUser.fullName,
        profileImage: updatedUser.profileImage
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/user/password", isAuthenticated, async (req, res) => {
    try {
      const user: any = req.user;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Verify current password using bcrypt
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Update password
      await storage.updateUser(user.id, { password: hashedPassword });
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password update error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/user/verify-email/send", isAuthenticated, async (req, res) => {
    try {
      const user: any = req.user;
      
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      
      // Generate or regenerate token
      const token = await storage.generateVerificationToken(user.id);
      
      // Send verification email using SendGrid
      const success = await EmailService.sendVerificationEmail(user.email, token);
      
      if (success) {
        res.json({ message: "Verification email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send verification email" });
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/user/verify-email/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const success = await storage.verifyEmail(token);
      
      if (!success) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }
      
      res.json({ message: "Email verified successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // LISTINGS ROUTES
  app.get("/api/listings", isAuthenticated, async (req, res) => {
    try {
      const user: any = req.user;
      const listings = await storage.getListingsByUserId(user.id);
      res.json(listings);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/listings/:id", isAuthenticated, async (req, res) => {
    try {
      const listing = await storage.getListing(parseInt(req.params.id));
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      const user: any = req.user;
      if (listing.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to view this listing" });
      }
      
      res.json(listing);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/listings", isAuthenticated, async (req, res) => {
    try {
      const user: any = req.user;
      const listingData = insertListingSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const listing = await storage.createListing(listingData);
      res.status(201).json(listing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/listings/:id", isAuthenticated, async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const listing = await storage.getListing(listingId);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      const user: any = req.user;
      if (listing.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to update this listing" });
      }
      
      const updatedListing = await storage.updateListing(listingId, req.body);
      res.json(updatedListing);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/listings/:id", isAuthenticated, async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const listing = await storage.getListing(listingId);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      const user: any = req.user;
      if (listing.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this listing" });
      }
      
      await storage.deleteListing(listingId);
      res.json({ message: "Listing deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // EMAIL TEMPLATES ROUTES
  app.get("/api/email-templates", isAuthenticated, async (req, res) => {
    try {
      const user: any = req.user;
      const templates = await storage.getEmailTemplatesByUserId(user.id);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/email-templates", isAuthenticated, async (req, res) => {
    try {
      const user: any = req.user;
      const templateData = insertEmailTemplateSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const template = await storage.createEmailTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/email-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.getEmailTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      const user: any = req.user;
      if (template.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to update this template" });
      }
      
      const updatedTemplate = await storage.updateEmailTemplate(templateId, req.body);
      res.json(updatedTemplate);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/email-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.getEmailTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      const user: any = req.user;
      if (template.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this template" });
      }
      
      await storage.deleteEmailTemplate(templateId);
      res.json({ message: "Email template deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // SOCIAL CONTENT ROUTES
  app.get("/api/social-content", isAuthenticated, async (req, res) => {
    try {
      const user: any = req.user;
      const content = await storage.getSocialContentByUserId(user.id);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/social-content", isAuthenticated, async (req, res) => {
    try {
      const user: any = req.user;
      const contentData = insertSocialContentSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const content = await storage.createSocialContent(contentData);
      res.status(201).json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/social-content/:id", isAuthenticated, async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      const content = await storage.getSocialContent(contentId);
      
      if (!content) {
        return res.status(404).json({ message: "Social content not found" });
      }
      
      const user: any = req.user;
      if (content.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this content" });
      }
      
      await storage.deleteSocialContent(contentId);
      res.json({ message: "Social content deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // SOCIAL ACCOUNTS ROUTES
  app.get("/api/social-accounts", isAuthenticated, async (req, res) => {
    try {
      const user: any = req.user;
      const accounts = await storage.getSocialAccountsByUserId(user.id);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/social-accounts", isAuthenticated, async (req, res) => {
    try {
      const user: any = req.user;
      const accountData = insertSocialAccountSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const account = await storage.createSocialAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/social-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getSocialAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Social account not found" });
      }
      
      const user: any = req.user;
      if (account.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this account" });
      }
      
      await storage.deleteSocialAccount(accountId);
      res.json({ message: "Social account disconnected successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // NOTIFICATION PREFERENCES ROUTES
  app.get("/api/notification-preferences", isAuthenticated, async (req, res) => {
    try {
      const user: any = req.user;
      let preferences = await storage.getNotificationPreferences(user.id);
      
      if (!preferences) {
        // Create default preferences if not exist
        preferences = await storage.createNotificationPreferences({
          userId: user.id,
          newLeadNotifications: true,
          listingUpdates: true,
          marketingEmails: false
        });
      }
      
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/notification-preferences", isAuthenticated, async (req, res) => {
    try {
      const user: any = req.user;
      const preferences = await storage.getNotificationPreferences(user.id);
      
      if (!preferences) {
        return res.status(404).json({ message: "Notification preferences not found" });
      }
      
      const updatedPreferences = await storage.updateNotificationPreferences(user.id, req.body);
      res.json(updatedPreferences);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Register custom route handlers for email and marketing features
  registerEmailRoutes(app, storage);
  registerMarketingRoutes(app, storage);

  // Set up site URL if not set - used in email links
  if (!process.env.SITE_URL) {
    process.env.SITE_URL = 'https://homesbin.com';
    console.log(`Notice: SITE_URL not set, using default: ${process.env.SITE_URL}`);
  }

  const httpServer = createServer(app);
  return httpServer;
}
