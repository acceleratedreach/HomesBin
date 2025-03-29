import { createClient } from '@supabase/supabase-js'

// We need to have a single instance to maintain auth state
// Using a simple approach with the latest Supabase version
const supabase = createClient(
  'https://wgwlpmlfhirxbdtseure.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indnd2xwbWxmaGlyeGJkdHNldXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMzc4MjYsImV4cCI6MjA1ODYxMzgyNn0.XrGQO_yiuq-UzK70vWiFSa_nUOdDKEmKwoPN8TU7_7w',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

export { supabase }