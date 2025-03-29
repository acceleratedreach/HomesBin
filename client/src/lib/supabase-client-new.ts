import { createClient } from '@supabase/supabase-js'

// Initialize the Supabase client
export const createSupabaseClient = async () => {
  // First try to get from the server, which should provide the latest configuration
  try {
    console.log('Initializing Supabase client...')
    const response = await fetch('/api/config')
    
    if (response.ok) {
      const { supabase } = await response.json()
      const { url, key } = supabase
      
      if (url && key) {
        console.log('Creating Supabase client with server config')
        return createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        })
      }
    }
  } catch (error) {
    console.error('Error fetching Supabase configuration:', error)
  }
  
  // Fallback to environment variables
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  if (supabaseUrl && supabaseKey) {
    console.log('Creating Supabase client with environment variables')
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }
  
  // Final fallback - these values should match your .env file
  console.warn('Using fallback Supabase configuration')
  return createClient(
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
}

// Singleton instance
let supabaseInstance: Awaited<ReturnType<typeof createSupabaseClient>>

// Initialize on script load
(async () => {
  supabaseInstance = await createSupabaseClient()
})()

// Provides a getter function that ensures the client is initialized
export const getSupabaseClient = async () => {
  if (!supabaseInstance) {
    supabaseInstance = await createSupabaseClient()
  }
  return supabaseInstance
}

// Basic exported client for immediate use (will be updated when async init completes)
export const supabase = createClient(
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