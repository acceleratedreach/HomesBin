/**
 * This script creates the profiles table in Supabase directly using the PostgreSQL connection
 * It's a simplified version focusing just on this critical table
 */

const { Client } = require('pg');

// Check for secrets (Replit secrets are automatically available as environment variables)
console.log('Checking for Supabase credentials in environment...');
console.log('Available environment variables:', Object.keys(process.env).filter(key => 
  key.includes('SUPABASE') || key.includes('DATABASE')
).join(', '));

// In Replit, secrets set in the Secrets panel are available as environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

console.log('Supabase URL found:', !!supabaseUrl);
console.log('Supabase Key found:', !!supabaseKey);
console.log('Database URL found:', !!databaseUrl);

// If we can't find the database URL, try to construct it from the Supabase connection details
let connectionString = databaseUrl;

if (!connectionString && supabaseUrl) {
  // Extract the project reference from the Supabase URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
  
  if (projectRef) {
    console.log('Attempting to construct database URL from Supabase project reference:', projectRef);
    // Construct a PostgreSQL connection string (this is a guess at the format, may need adjustment)
    connectionString = `postgresql://postgres:postgres@db.${projectRef}.supabase.co:5432/postgres`;
    console.log('Constructed database URL:', connectionString.replace(/:[^:]*@/, ':****@'));
  }
}

if (!connectionString) {
  console.error('Missing database connection info. Please set SUPABASE_URL and SUPABASE_KEY or DATABASE_URL as Replit Secrets.');
  process.exit(1);
}

// Create the PostgreSQL client
const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false } // Required for cloud hosting
});

// Profiles table SQL - the minimal version we need to get things working
const createProfilesTableSQL = `
-- Create profiles table (required for authentication)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

// Main function
async function setupProfilesTable() {
  try {
    // Connect to the database
    console.log('Attempting to connect to PostgreSQL database...');
    await client.connect();
    console.log('Connected to PostgreSQL database successfully!');
    
    // Create the profiles table
    console.log('Creating profiles table...');
    await client.query(createProfilesTableSQL);
    console.log('Created or verified profiles table');
    
    // Check if the table exists
    console.log('Verifying profiles table existence...');
    const tableExistsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
      );
    `);
    
    if (tableExistsResult.rows[0].exists) {
      console.log('SUCCESS: Profiles table exists in the database.');
    } else {
      console.error('ERROR: Profiles table does not exist despite creation attempt.');
    }
    
  } catch (error) {
    console.error('Error setting up profiles table:', error.message);
  } finally {
    // Close the client connection
    await client.end();
    console.log('Database connection closed.');
  }
}

// Run the setup
console.log('Starting profiles table setup...');
setupProfilesTable().then(() => {
  console.log('Profiles table setup completed.');
}).catch(err => {
  console.error('Setup failed:', err);
}); 