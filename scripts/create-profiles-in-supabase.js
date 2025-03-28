/**
 * Supabase profiles table checker and helper
 * This script doesn't need external dependencies - it just provides 
 * guidance for creating the profiles table manually.
 */

// Log the available environment variables for database connection
console.log('\n=== CHECKING FOR SUPABASE CREDENTIALS ===');
console.log('Looking for Supabase environment variables...');

const envVars = Object.keys(process.env)
  .filter(key => key.includes('SUPABASE') || key.includes('DATABASE'))
  .sort();

console.log('Found these potentially relevant environment variables:');
console.log(envVars.join('\n'));

// Get Supabase URL from environment
const supabaseUrl = process.env.SUPABASE_URL;
if (supabaseUrl) {
  console.log('\nDetected Supabase URL:', supabaseUrl);
  
  // Try to extract the project reference
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
  if (projectRef) {
    console.log('Project reference:', projectRef);
    console.log('You can access your project at:', `https://app.supabase.com/project/${projectRef}`);
  }
} else {
  console.log('\nNo Supabase URL found in environment variables.');
  console.log('Please set the SUPABASE_URL as a Replit Secret.');
}

// Print SQL instructions
console.log('\n=== PROFILES TABLE SQL INSTRUCTIONS ===');
console.log('The "profiles" table is required for authentication to work properly.');
console.log('If you see errors about the "profiles" table not existing, you need to create it.');
console.log('\nTo create the profiles table:');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to the "SQL Editor" section');
console.log('3. Create a new query and paste the following SQL:');

const profilesTableSQL = `
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to maintain the updated_at column
CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Set up Row Level Security policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Set up a trigger to create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    ''
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call handle_new_user when a new user is created
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

console.log('\n```sql');
console.log(profilesTableSQL);
console.log('```\n');

console.log('4. Click "Run" to execute the SQL and create the profiles table');
console.log('5. Restart your application');

console.log('\n=== TROUBLESHOOTING ===');
console.log('If you continue to have issues:');
console.log('1. Check that your Supabase URL and API key are correctly set as Replit Secrets');
console.log('2. Verify that your API key has permission to create tables');
console.log('3. Check the Supabase logs for any errors related to the profiles table or authentication'); 