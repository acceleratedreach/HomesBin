/**
 * Direct SQL query script to create the profiles table in Supabase database
 */

// Import required modules
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from Replit secrets
console.log('Checking for Supabase credentials in environment...');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

console.log('Supabase URL found:', !!supabaseUrl);
console.log('Supabase Key found:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_KEY/SUPABASE_ANON_KEY as Replit Secrets.');
  process.exit(1);
}

// Create a Supabase client
console.log('Creating Supabase client...');
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL query to create the profiles table
const createProfilesSQL = `
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

// Function to run the SQL query
async function createProfilesTable() {
  try {
    console.log('Executing SQL to create profiles table...');
    
    // Run the SQL query directly
    const { error } = await supabase.rpc('exec_sql', { sql: createProfilesSQL });
    
    if (error) {
      if (error.message.includes('function "exec_sql" does not exist')) {
        console.error('Error: The exec_sql function is not available in your Supabase project.');
        console.log('This is normal if you are using a standard Supabase setup.');
        console.log('Please use the Supabase dashboard SQL Editor to execute this SQL directly:');
        console.log('\n' + createProfilesSQL + '\n');
      } else {
        console.error('Error creating profiles table:', error.message);
      }
      return false;
    }
    
    console.log('SQL executed successfully!');
    return true;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

// Check if the profiles table exists using Supabase's API
async function checkProfilesTable() {
  try {
    console.log('Checking if profiles table exists...');
    
    // Attempt to query the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.error('Error: profiles table does not exist.');
        return false;
      } else {
        console.error('Error checking profiles table:', error.message);
        return false;
      }
    }
    
    console.log('Profiles table exists! Current count:', data.count);
    return true;
  } catch (error) {
    console.error('Error checking profiles table:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('Starting Supabase database setup...');
  
  // First check if profiles table already exists
  const tableExists = await checkProfilesTable();
  
  if (!tableExists) {
    console.log('Profiles table does not exist, creating it...');
    const created = await createProfilesTable();
    
    if (created) {
      // Verify the table was created
      await checkProfilesTable();
    }
  } else {
    console.log('Profiles table already exists, no action needed.');
  }
  
  console.log('Database setup process completed.');
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
}); 