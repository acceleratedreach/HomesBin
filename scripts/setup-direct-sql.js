const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

// Load environment variables
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  console.error('Missing database URL. Please set DATABASE_URL or SUPABASE_DB_URL environment variable.');
  process.exit(1);
}

console.log('Using database URL:', databaseUrl.replace(/:[^:]*@/, ':****@'));

// Create a PostgreSQL client
const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false } // Required for some Supabase/Neon setups
});

// Main function to run migrations
async function setupDatabase() {
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to PostgreSQL database');
    
    // Read SQL migration file
    const migrationFile = path.join(__dirname, '..', 'supabase', 'migration.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .filter(statement => statement.trim() !== '')
      .map(statement => statement.trim());
    
    console.log(`Found ${statements.length} SQL statements to execute.`);
    
    // First create the timestamp function which other statements might depend on
    const timestampFunctionSql = `
    CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    `;
    
    try {
      await client.query(timestampFunctionSql);
      console.log('Created timestamp function.');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Timestamp function already exists, skipping.');
      } else {
        console.error('Error creating timestamp function:', error);
      }
    }
    
    // Execute each statement
    let successCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      try {
        await client.query(statement);
        console.log(`Statement #${i + 1} executed successfully.`);
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`Statement #${i + 1} - Object already exists, skipping.`);
          successCount++;
        } else {
          console.error(`Error executing statement #${i + 1}:`, error.message);
          console.log('Statement:', statement);
        }
      }
    }
    
    console.log(`Database setup completed. ${successCount} of ${statements.length} statements executed successfully.`);
    
    // Verify that the profiles table exists
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'profiles'
        );
      `);
      
      if (result.rows[0].exists) {
        console.log('Profiles table exists in the database.');
        
        // Count profiles
        const countResult = await client.query('SELECT COUNT(*) FROM profiles');
        console.log(`Current profile count: ${countResult.rows[0].count}`);
      } else {
        console.error('CRITICAL: Profiles table does not exist in the database!');
      }
    } catch (error) {
      console.error('Error verifying profiles table:', error.message);
    }
    
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    // Close the client connection
    try {
      await client.end();
      console.log('Database connection closed.');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
}

// Run the setup
setupDatabase().then(() => {
  console.log('Database setup process completed.');
}).catch(err => {
  console.error('Database setup failed:', err);
}); 