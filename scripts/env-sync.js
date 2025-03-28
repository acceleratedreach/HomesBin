#!/usr/bin/env node

/**
 * This script synchronizes Replit Secrets with environment variable files
 * It's designed to run during deployment to ensure environment variables are available
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load existing environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

// Define the path to the environment files
const envPath = path.resolve(process.cwd(), '.env.local');
const backupEnvPath = path.resolve(process.cwd(), '.env.production.local');

console.log('Environment sync script running...');
console.log('Current directory:', process.cwd());
console.log('Target .env path:', envPath);

// Check if we're in a Replit environment
const isReplit = process.env.REPL_ID || process.env.REPL_SLUG || process.env.REPLIT;
console.log('Replit environment detected:', !!isReplit);

// Create a template for environment variables with placeholders
function generateEnvFileContent() {
  return `# Supabase Auth Environment Variables - Auto-generated
# Last updated: ${new Date().toISOString()}

# Direct URL and key values
SUPABASE_URL=${process.env.SUPABASE_URL || ''}
SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY || ''}

# Frontend environment variables for Vite 
VITE_SUPABASE_URL=${process.env.SUPABASE_URL || ''}
VITE_SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY || ''}

# Alternative format for React applications (legacy support)
REACT_APP_SUPABASE_URL=${process.env.SUPABASE_URL || ''}
REACT_APP_SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY || ''}

# Environment indicators
NODE_ENV=${process.env.NODE_ENV || 'production'}

# Replit-specific fallbacks
REPLIT_SUPABASE_URL=${process.env.SUPABASE_URL || ''}
REPLIT_SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY || ''}

# Debugging info
DEPLOYMENT_TIMESTAMP=${Date.now()}
REPL_ID=${process.env.REPL_ID || ''}
REPL_SLUG=${process.env.REPL_SLUG || ''}
`;
}

try {
  // Create or update the .env.local file
  fs.writeFileSync(envPath, generateEnvFileContent());
  console.log('Successfully wrote environment variables to .env.local');
  
  // Also create a backup .env.production.local file
  fs.writeFileSync(backupEnvPath, generateEnvFileContent());
  console.log('Successfully wrote backup environment variables to .env.production.local');
  
  // Verify the content was written correctly (without showing sensitive values)
  const fileContent = fs.readFileSync(envPath, 'utf8');
  const hasUrl = fileContent.includes('SUPABASE_URL=') && !fileContent.includes('SUPABASE_URL=\n');
  const hasKey = fileContent.includes('SUPABASE_ANON_KEY=') && !fileContent.includes('SUPABASE_ANON_KEY=\n');
  
  console.log('Verification:', {
    fileExists: fs.existsSync(envPath),
    hasUrl,
    hasKey,
    fileSize: fs.statSync(envPath).size,
    timestamp: new Date().toISOString()
  });
  
} catch (error) {
  console.error('Error syncing environment variables:', error);
  process.exit(1);
}

console.log('Environment sync complete!');