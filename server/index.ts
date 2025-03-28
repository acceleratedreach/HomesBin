import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add enhanced CORS middleware with production-ready settings
app.use((req, res, next) => {
  // For all requests, provide comprehensive CORS headers
  // This ensures cross-domain requests work properly in all environments
  const origin = req.headers.origin || '';
  const host = req.headers.host || '';
  
  // Detect if we're in specific environments
  const isReplit = host.includes('.repl.');
  const isProduction = process.env.NODE_ENV === 'production';
  const isHomesbin = origin.includes('homesbin.com');
  
  // Determine which origins to allow
  let allowedOrigin = '*'; // Default to all origins for dev
  
  if (origin) {
    // If there's a specific origin in the request, allow it
    // This handles direct browser requests properly
    allowedOrigin = origin;
    
    // Log CORS handling for debugging
    if (req.path.startsWith('/api')) {
      log(`CORS: Allowing origin ${origin.substring(0, 30)}... for ${req.method} ${req.path}`, 'cors');
    }
  }
  
  // Set comprehensive CORS headers
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Api-Key, X-Client-Info');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-RateLimit-Limit, X-RateLimit-Remaining');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  
  // Handle preflight OPTIONS requests efficiently
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
