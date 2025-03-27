# Supabase Setup Instructions

This folder contains the SQL migration scripts needed to set up your Supabase project for authentication and data storage.

## Requirements

- A Supabase account and project
- Access to the Supabase SQL Editor

## Setup Steps

1. Copy your Supabase project URL and anon key from the Supabase dashboard (Settings > API)
2. Add these credentials to your environment variables:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
3. Run the migration SQL script in the Supabase SQL Editor:
   - Log in to your Supabase dashboard
   - Navigate to the SQL Editor
   - Create a "New Query"
   - Paste the contents of `migration.sql` and run the query

## Database Schema

The migration script sets up:

### Tables
- `profiles`: Stores user profile information linked to auth.users
- `social_accounts`: Stores social media accounts linked to user profiles
- `user_notes`: Demo table for storing personal notes (used in the SupabaseExample component)
- `listings`: Stores real estate property listings with detailed property information
- `user_themes`: Stores user interface customization preferences for profile templates

### Storage Buckets
- `avatars`: For storing user profile images

### Security
- Row-Level Security (RLS) policies for all tables
- Triggers to automatically create a profile when a user signs up

## Authentication Configuration

Make sure you have enabled the following in your Supabase Authentication settings:

1. Email auth provider
2. Email confirmations (recommended)
3. Proper redirect URLs for your application
4. Password recovery flow

## Important Notes

- The migration script uses database triggers to automatically create a profile when a user signs up
- Row-Level Security (RLS) policies are set up to ensure users can only modify their own data
- The `auth.users` table is managed by Supabase Auth and should not be modified directly