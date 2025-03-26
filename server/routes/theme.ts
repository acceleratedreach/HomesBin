import type { Express, Request, Response } from "express";
import { IStorage } from "../storage";
import { z } from "zod";

// Theme update schema
const updateThemeSchema = z.object({
  templateId: z.string().optional(),
  primaryColor: z.string().optional(),
  colorMode: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  borderRadius: z.number().optional(),
  customCss: z.string().optional(),
  headerLayout: z.string().optional(),
  featuredListingsLayout: z.string().optional(),
  contactFormEnabled: z.boolean().optional(),
  socialLinksEnabled: z.boolean().optional()
});

export function registerThemeRoutes(app: Express, storage: IStorage) {
  // Get user theme
  app.get("/api/themes/current", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const user = req.user as any;
      const theme = await storage.getUserTheme(user.id);
      res.json(theme);
    } catch (error) {
      console.error("Error fetching theme:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get theme for a specific user (public)
  app.get("/api/users/:username/theme", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const theme = await storage.getUserTheme(user.id);
      res.json(theme);
    } catch (error) {
      console.error("Error fetching user theme:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update user theme
  app.patch("/api/themes/current", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const user = req.user as any;
      const themeData = updateThemeSchema.parse(req.body);
      
      const updatedTheme = await storage.updateUserTheme(user.id, themeData);
      
      if (!updatedTheme) {
        return res.status(404).json({ message: "Theme not found" });
      }
      
      res.json(updatedTheme);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Error updating theme:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
} 