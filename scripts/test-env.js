#!/usr/bin/env node

/**
 * Test script to verify environment variables are being loaded properly
 * This helps identify issues with Replit Secrets and environment variables
 */

console.log('Environment Variable Test Script');
console.log('===============================');
console.log('');

console.log('Node Environment:', process.env.NODE_ENV);
console.log('');

// Check for Supabase environment variables
console.log('Checking Supabase environment variables:');
console.log('---------------------------------------');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('SUPABASE_URL:', supabaseUrl ? `Found (${supabaseUrl.substring(0, 10)}...)` : 'Not found');
console.log('SUPABASE_ANON_KEY:', supabaseKey ? `Found (${supabaseKey.substring(0, 5)}...)` : 'Not found');

// Check for any environment variables with VITE prefix
console.log('');
console.log('Checking Vite environment variables:');
console.log('----------------------------------');
const viteVars = Object.keys(process.env).filter(key => key.startsWith('VITE_'));
console.log('VITE_ variables count:', viteVars.length);

viteVars.forEach(key => {
  const value = process.env[key];
  console.log(`${key}:`, value ? `Found (${value.length > 10 ? value.substring(0, 10) + '...' : value})` : 'Not found or empty');
});

// Check the .env.local file
console.log('');
console.log('Reading .env.local file:');
console.log('---------------------');
const fs = require('fs');
const path = require('path');

try {
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
  console.log('.env.local exists. Content:');
  console.log('```');
  console.log(envLocalContent);
  console.log('```');
} catch (err) {
  console.log('Failed to read .env.local file:', err.message);
}

// Check the .env file
console.log('');
console.log('Reading .env file:');
console.log('--------------');
try {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('.env exists. Content:');
  console.log('```');
  console.log(envContent);
  console.log('```');
} catch (err) {
  console.log('Failed to read .env file:', err.message);
}

console.log('');
console.log('Recommendations:');
console.log('---------------');
if (!supabaseUrl || !supabaseKey) {
  console.log('1. Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in Replit Secrets');
  console.log('2. Verify your .env.local file has these lines:');
  console.log('   VITE_SUPABASE_URL=$SUPABASE_URL');
  console.log('   VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY');
  console.log('3. Try restarting your Replit server to load the environment variables');
} else {
  console.log('- Supabase environment variables appear to be properly configured');
}

console.log('');
console.log('===============================');
console.log('Test completed'); 