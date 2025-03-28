import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertListingSchema, 
  insertEmailTemplateSchema, 
  insertSocialContentSchema,
  insertSocialAccountSchema,
  insertNotificationPreferencesSchema,
  insertLotSchema,
  insertMapSettingsSchema,
  updateLotSchema
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
import { registerThemeRoutes } from "./routes/theme";
import { registerSupabaseRoutes } from "./routes/supabase";
import { registerAuthRoutes, supabaseAuth } from "./routes/auth";
import { EmailService } from "./services/emailService";
import { registerUserRoutes } from "./routes/user";
import { registerListingsRoutes } from "./routes/listings";

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function to get environment variables from multiple sources
  function getSecureEnvVariable(key: string): string | undefined {
    // First try direct process.env access (Replit Secrets should be here)
    let value = process.env[key];
    
    // If not found and we're in a Node.js environment, try more approaches
    if (!value && typeof process !== 'undefined') {
      // Check if we might be in Replit and secrets need special access
      if (process.env.REPL_ID || process.env.REPL_OWNER || process.env.REPL_SLUG) {
        console.log(`[API Config] Checking for ${key} in Replit Secrets...`);
        
        // Try Replit-specific global secrets handling, if available
        if (global && (global as any).__repl_secrets) {
          value = (global as any).__repl_secrets[key];
          if (value) {
            console.log(`[API Config] Retrieved ${key} from Replit Secrets global object`);
          }
        }
      }
    }
    
    return value;
  }

  // Add endpoint to provide Supabase credentials to the client
  app.get('/api/config', (req, res) => {
    // Allow cross-origin for this endpoint specifically - use origin if available
    const requestOrigin = req.headers.origin || '*';
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Detect if this is a preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(204).send();
    }
    
    // Determine the site URL from headers for proper redirects
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const origin = req.headers.origin || '';
    
    // Try to use the best site URL possible
    // 1. Use the Origin header if available (best for cross-domain requests)
    // 2. Otherwise, fallback to constructed URL from protocol and host
    const siteUrl = origin || `${protocol}://${host}`;
    
    // Check if we're in a Replit environment
    const isReplit = host?.includes('.repl.co') || 
                     host?.includes('.replit.dev') || 
                     !!process.env.REPL_ID || 
                     !!process.env.REPL_SLUG;
    
    // Read environment variables for Supabase with fallbacks
    let supabaseUrl = process.env.SUPABASE_URL;
    let supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    // If not found directly, try our special helper function
    if (!supabaseUrl) {
      console.log('[API Config] SUPABASE_URL not found directly, trying alternate methods');
      supabaseUrl = getSecureEnvVariable('SUPABASE_URL');
    }
    
    if (!supabaseKey) {
      console.log('[API Config] SUPABASE_ANON_KEY not found directly, trying alternate methods');
      supabaseKey = getSecureEnvVariable('SUPABASE_ANON_KEY');
    }
    
    // If we still don't have values, try to find them in the environment
    if (!supabaseUrl || !supabaseKey) {
      // Look for any environment variables that might contain our targets
      const envKeys = Object.keys(process.env);
      
      console.log('[API Config] Searching env vars for Supabase credentials...');
      
      // Look for any key that might be the Supabase URL
      if (!supabaseUrl) {
        for (const key of envKeys) {
          const value = process.env[key] || '';
          if (
            !key.includes('KEY') && 
            !key.includes('SECRET') && 
            value.includes('supabase.co')
          ) {
            console.log(`[API Config] Found potential Supabase URL in ${key}`);
            supabaseUrl = value;
            break;
          }
        }
      }
      
      // Look for any key that might be the Supabase key
      if (!supabaseKey) {
        for (const key of envKeys) {
          const value = process.env[key] || '';
          if (
            (key.includes('KEY') || key.includes('TOKEN')) && 
            value.length > 20 &&
            value.includes('eyJ')
          ) {
            console.log(`[API Config] Found potential Supabase key in ${key}`);
            supabaseKey = value;
            break;
          }
        }
      }
    }
    
    // Special handling for Replit and production environments
    if (isReplit || process.env.NODE_ENV === 'production') {
      console.log('[API Config] Running in Replit or production environment');
      
      // Add more logging for Replit environment
      if (isReplit) {
        console.log('[API Config] Debug - Replit environment:', {
          REPL_ID: !!process.env.REPL_ID,
          REPL_SLUG: !!process.env.REPL_SLUG,
          REPL_OWNER: !!process.env.REPL_OWNER,
          host
        });
      }
      
      // Add more logging for production environment
      if (process.env.NODE_ENV === 'production') {
        console.log('[API Config] Debug - Production environment variables found:', 
          Object.keys(process.env)
            .filter(key => !key.includes('KEY') && !key.includes('SECRET') && !key.includes('TOKEN') && !key.includes('PASS'))
            .join(', ')
        );
      }
    }
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('[API Config] Supabase credentials missing after all attempts:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlFound: supabaseUrl ? 'Yes' : 'No',
        keyFound: supabaseKey ? 'Yes' : 'No',
        siteUrl
      });
      
      // Return clear error for troubleshooting
      return res.status(500).json({
        error: 'Missing Supabase configuration',
        details: {
          missingUrl: !supabaseUrl,
          missingKey: !supabaseKey,
          environment: process.env.NODE_ENV || 'development',
          isReplit,
          timestamp: new Date().toISOString()
        }
      });
    } 
    
    // Success case - all config present
    console.log('[API Config] Providing Supabase config with valid credentials', {
      urlLength: supabaseUrl.length,
      keyLength: supabaseKey.length,
      detectedSiteUrl: siteUrl,
      isReplit
    });

    // Enhanced response with more context and debugging info
    res.json({
      supabase: {
        url: supabaseUrl,
        key: supabaseKey,
        siteUrl: siteUrl
      },
      production: process.env.NODE_ENV === 'production',
      timestamp: new Date().toISOString(),
      environment: {
        isReplit,
        host: host || 'unknown',
        protocol: protocol || 'unknown',
        nodeEnv: process.env.NODE_ENV || 'development'
      }
    });
  });
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
  const isAuthenticated = async (req: Request, res: Response, next: any) => {
    // First try Supabase auth
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return supabaseAuth(req, res, next);
    }
    
    // Fall back to passport/session auth if no Bearer token
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
      profileImage: user.profileImage,
      title: user.title,
      phone: user.phone,
      location: user.location,
      experience: user.experience,
      bio: user.bio,
      specialties: user.specialties,
      licenses: user.licenses
    });
  });
  
  // Get public user profile by username
  app.get("/api/users/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return public profile data (excluding sensitive info)
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        title: user.title,
        phone: user.phone,
        location: user.location,
        experience: user.experience,
        bio: user.bio,
        specialties: user.specialties,
        licenses: user.licenses
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get public listings for a user by username
  app.get("/api/users/:username/listings", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get only publicly visible listings
      const listings = await storage.getListingsByUserId(user.id);
      const publicListings = listings.filter(listing => listing.isPublic !== false);
      
      res.json(publicListings);
    } catch (error) {
      console.error("Error fetching user listings:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get theme settings for a user by username (public)
  app.get("/api/users/:username/theme", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const theme = await storage.getUserTheme(user.id);
      
      if (!theme) {
        // Return default theme if none is set
        return res.json({
          primaryColor: "#4f46e5",
          secondaryColor: "#10b981",
          fontFamily: "Inter",
          borderRadius: "medium",
          darkMode: false,
          template: "ProfessionalTemplate"
        });
      }
      
      res.json(theme);
    } catch (error) {
      console.error("Error fetching user theme:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/user", isAuthenticated, async (req, res) => {
    try {
      const user: any = req.user;
      
      // Allow updating all profile fields
      const allowedFields = [
        "username", "email", "fullName", "profileImage", 
        "title", "phone", "location", "experience", 
        "bio", "specialties", "licenses"
      ];
      const updateData: any = {};
      
      // Make sure we preserve the email verification status unless the email is changed
      updateData.emailVerified = user.emailVerified;
      
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
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        emailVerified: updatedUser.emailVerified,
        fullName: updatedUser.fullName,
        profileImage: updatedUser.profileImage,
        title: updatedUser.title,
        phone: updatedUser.phone,
        location: updatedUser.location,
        experience: updatedUser.experience,
        bio: updatedUser.bio,
        specialties: updatedUser.specialties,
        licenses: updatedUser.licenses
      });
    } catch (error) {
      console.error("Error updating user:", error);
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

  // Support both URL patterns for verification to ensure backward compatibility
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
  
  // Support query param pattern for token (used by client)
  app.get("/api/user/verify-email", async (req, res) => {
    try {
      const token = req.query.token as string;
      
      if (!token) {
        return res.status(400).json({ message: "No verification token provided" });
      }
      
      const success = await storage.verifyEmail(token);
      
      if (!success) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }
      
      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Error in verify-email route:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // LISTINGS ROUTES
  app.get("/api/listings", isAuthenticated, async (req, res) => {
    try {
      const user: any = req.user;
      
      // Debug logging to see what's happening
      console.log('Listings API request received for user:', {
        userId: user?.id,
        hasUser: !!user,
        headers: Object.keys(req.headers),
        hasAuthHeader: !!req.headers.authorization
      });
      
      if (!user || !user.id) {
        console.error('Missing user or user ID in listings request', { user });
        
        // Return mock data when user is missing (better UX than an error)
        return res.json([
          {
            id: 999,
            title: "API Error - Mock Listing",
            description: "This is a mock listing because we couldn't get your real listings. Please try refreshing.",
            price: 350000,
            location: "Server Error, USA",
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 1800,
            yearBuilt: 2020,
            status: "active",
            type: "single-family",
            imageUrl: "https://placehold.co/600x400?text=API+Error",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      }
      
      try {
        const listings = await storage.getListingsByUserId(user.id);
        console.log(`Retrieved ${listings.length} listings for user ${user.id}`);
        
        // If no listings, return an empty array instead of null
        return res.json(listings || []);
      } catch (storageError) {
        console.error('Error fetching listings from storage:', storageError);
        
        // Return mock data on storage error
        return res.json([
          {
            id: 998,
            title: "Storage Error - Mock Listing",
            description: "This is a mock listing because we had a database error. Please try again later.",
            price: 275000,
            location: "Database Error, USA",
            bedrooms: 2,
            bathrooms: 1,
            squareFeet: 1200,
            yearBuilt: 2018,
            status: "active",
            type: "condo",
            imageUrl: "https://placehold.co/600x400?text=Storage+Error",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error("Unhandled error in listings API:", error);
      
      // Return mock data instead of error for better UX
      res.json([
        {
          id: 997,
          title: "Server Error - Mock Listing",
          description: "This is a mock listing because we had a server error. Please try again later.",
          price: 425000,
          location: "Server Error, USA",
          bedrooms: 4,
          bathrooms: 3,
          squareFeet: 2400,
          yearBuilt: 2022,
          status: "active",
          type: "single-family",
          imageUrl: "https://placehold.co/600x400?text=Server+Error",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
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
  registerThemeRoutes(app, storage);
  registerSupabaseRoutes(app);
  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerListingsRoutes(app);

  // Set up site URL if not set - used in email links
  if (!process.env.SITE_URL) {
    process.env.SITE_URL = 'https://homesbin.com';
    console.log(`Notice: SITE_URL not set, using default: ${process.env.SITE_URL}`);
  }

  // Lot map routes
  app.get("/api/lots", async (req, res) => {
    try {
      const mapId = req.query.mapId ? parseInt(req.query.mapId as string) : undefined;
      const lots = await storage.getLots(mapId);
      res.json(lots);
    } catch (error) {
      console.error("Error getting lots:", error);
      res.status(500).json({ message: "Failed to retrieve lots" });
    }
  });

  app.get("/api/lots/:id", async (req, res) => {
    try {
      const lot = await storage.getLot(parseInt(req.params.id));
      if (!lot) {
        res.status(404).json({ message: "Lot not found" });
        return;
      }
      res.json(lot);
    } catch (error) {
      console.error("Error getting lot:", error);
      res.status(500).json({ message: "Failed to retrieve lot" });
    }
  });

  app.get("/api/lots/search", async (req, res) => {
    try {
      const query = z.string().parse(req.query.q);
      const results = await storage.searchLots(query);
      res.json(results);
    } catch (error) {
      console.error("Error searching lots:", error);
      res.status(500).json({ message: "Failed to search lots" });
    }
  });

  app.get("/api/lots/filter", async (req, res) => {
    try {
      const filterSchema = z.object({
        status: z.string().optional(),
        minPrice: z.coerce.number().optional(),
        maxPrice: z.coerce.number().optional(),
        minSqft: z.coerce.number().optional(),
        maxSqft: z.coerce.number().optional(),
      });

      const filters = filterSchema.parse(req.query);
      const results = await storage.filterLots(filters);
      res.json(results);
    } catch (error) {
      console.error("Error filtering lots:", error);
      res.status(500).json({ message: "Failed to filter lots" });
    }
  });

  app.post("/api/lots", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const lotData = insertLotSchema.parse(req.body);
      // Add the current user's ID to the lot data
      const newLot = { ...lotData, userId: req.session.user.id };
      
      const lot = await storage.createLot(newLot);
      res.status(201).json(lot);
    } catch (error) {
      console.error("Error creating lot:", error);
      res.status(400).json({ message: "Invalid lot data" });
    }
  });

  app.patch("/api/lots/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const lotId = parseInt(req.params.id);
      
      // First check if the user owns this lot
      const existingLot = await storage.getLot(lotId);
      if (!existingLot) {
        return res.status(404).json({ message: "Lot not found" });
      }
      
      if (existingLot.userId !== req.session.user.id) {
        return res.status(403).json({ message: "You don't have permission to edit this lot" });
      }
      
      const updateData = updateLotSchema.parse({ ...req.body, id: lotId });
      const lot = await storage.updateLot(updateData);
      res.json(lot);
    } catch (error) {
      console.error("Error updating lot:", error);
      res.status(400).json({ message: "Invalid lot data" });
    }
  });

  app.delete("/api/lots/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const lotId = parseInt(req.params.id);
      
      // First check if the user owns this lot
      const existingLot = await storage.getLot(lotId);
      if (!existingLot) {
        return res.status(404).json({ message: "Lot not found" });
      }
      
      if (existingLot.userId !== req.session.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this lot" });
      }
      
      await storage.deleteLot(lotId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting lot:", error);
      res.status(500).json({ message: "Failed to delete lot" });
    }
  });

  // Map Settings routes
  app.get("/api/map-settings", async (req, res) => {
    try {
      if (req.query.slug) {
        const settings = await storage.getMapSettings(req.query.slug as string);
        res.json(settings || {});
      } else if (req.session.user) {
        // If authenticated but no slug, return the user's map settings
        const settings = await storage.getUserMapSettings(req.session.user.id);
        res.json(settings || []);
      } else {
        // If not authenticated and no slug, return empty object
        res.json({});
      }
    } catch (error) {
      console.error("Error getting map settings:", error);
      res.status(500).json({ message: "Failed to retrieve map settings" });
    }
  });

  app.get("/api/map-settings/:id", async (req, res) => {
    try {
      const settings = await storage.getMapSettingsById(parseInt(req.params.id));
      if (!settings) {
        res.status(404).json({ message: "Map settings not found" });
        return;
      }
      res.json(settings);
    } catch (error) {
      console.error("Error getting map settings:", error);
      res.status(500).json({ message: "Failed to retrieve map settings" });
    }
  });

  app.post("/api/map-settings", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized - Please log in" });
      }
      
      const settingsData = insertMapSettingsSchema.parse(req.body);
      
      // Check if slug already exists
      if (settingsData.slug) {
        const existingMap = await storage.getMapSettings(settingsData.slug);
        if (existingMap && existingMap.length > 0) {
          return res.status(400).json({ message: "A map with this name already exists. Please choose a different name." });
        }
      }
      
      // Add the current user's ID to the settings data
      const newSettings = { ...settingsData, userId: req.session.user.id };
      
      // If updating existing settings
      if (req.body.id) {
        const existingSettings = await storage.getMapSettingsById(req.body.id);
        
        if (!existingSettings) {
          return res.status(404).json({ message: "Map settings not found" });
        }
        
        if (existingSettings.userId !== req.session.user.id) {
          return res.status(403).json({ message: "You don't have permission to edit these settings" });
        }
        
        const updated = await storage.updateMapSettings({
          ...newSettings,
          id: req.body.id
        });
        return res.json(updated);
      }
      
      // Creating new settings
      const settings = await storage.createMapSettings(newSettings);
      res.status(201).json(settings);
    } catch (error) {
      console.error("Error creating/updating map settings:", error);
      if (error.errors) {
        // Zod validation error
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(400).json({ message: "Invalid map settings data" });
    }
  });

  app.delete("/api/map-settings/:id", async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const settingsId = parseInt(req.params.id);
      
      // First check if the user owns these settings
      const existingSettings = await storage.getMapSettingsById(settingsId);
      if (!existingSettings) {
        return res.status(404).json({ message: "Map settings not found" });
      }
      
      if (existingSettings.userId !== req.session.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete these settings" });
      }
      
      await storage.deleteMapSettings(settingsId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting map settings:", error);
      res.status(500).json({ message: "Failed to delete map settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
