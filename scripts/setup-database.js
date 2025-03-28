const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
  process.exit(1);
}

console.log('Connecting to Supabase at:', supabaseUrl);

// Create a Supabase client with admin rights
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Main function to run migrations
async function setupDatabase() {
  try {
    console.log('Starting database setup...');
    
    // Read SQL migration file
    const migrationFile = path.join(__dirname, '..', 'supabase', 'migration.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Split SQL into statements
    const statements = sql
      .split(';')
      .filter(statement => statement.trim() !== '')
      .map(statement => statement.trim() + ';');
    
    console.log(`Found ${statements.length} SQL statements to execute.`);
    
    // Function to create update_timestamp function
    const createTimestampFunction = async () => {
      const { error } = await supabase.rpc('create_update_timestamp_function', {});
      if (error && !error.message.includes('already exists')) {
        console.error('Error creating timestamp function:', error);
        throw error;
      }
      return true;
    };
    
    try {
      // First try to execute the timestamp function through RPC
      await createTimestampFunction();
      console.log('Created or verified timestamp function.');
    } catch (err) {
      console.log('Creating timestamp function through direct SQL...');
      
      // Define the function directly using SQL
      const timestampFunctionSql = `
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      `;
      
      const { error } = await supabase.rpc('exec_sql', { sql: timestampFunctionSql });
      if (error && !error.message.includes('already exists')) {
        console.error('Error creating timestamp function:', error);
      } else {
        console.log('Created timestamp function through SQL.');
      }
    }
    
    // Execute each statement
    let successCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        // Use the built-in SQL execution if available, otherwise use RPC
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Check if it's just that the object already exists
          if (error.message.includes('already exists')) {
            console.log(`Statement #${i + 1} - Object already exists, skipping.`);
            successCount++;
          } else {
            console.error(`Error executing statement #${i + 1}:`, error);
            console.log('Statement:', statement);
          }
        } else {
          console.log(`Statement #${i + 1} executed successfully.`);
          successCount++;
        }
      } catch (error) {
        console.error(`Error executing statement #${i + 1}:`, error.message);
        console.log('Statement:', statement);
      }
    }
    
    console.log(`Database setup completed. ${successCount} of ${statements.length} statements executed successfully.`);
    
    // Verify profiles table exists
    const { data, error } = await supabase.from('profiles').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error checking profiles table:', error);
      if (error.code === '42P01') { // Table doesn't exist
        console.error('CRITICAL: Profiles table was not created properly!');
      }
    } else {
      console.log('Profiles table verified. Current count:', data.count);
    }
    
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Run the setup
setupDatabase().then(() => {
  console.log('Setup process completed.');
}).catch(err => {
  console.error('Setup failed:', err);
}); 