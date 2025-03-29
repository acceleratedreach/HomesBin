import { createClient } from '@supabase/supabase-js'

/**
 * This is a simplified Supabase client implementation that prioritizes:
 * 1. Reliability of auth sessions
 * 2. Consistent configuration
 * 3. Simple, maintainable code
 */

// Create a Supabase client with proper auth configuration
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

// Add debugging helpers to the window object
if (typeof window !== 'undefined') {
  Object.assign(window, {
    checkSupabaseSession: async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        return {
          hasSession: !!data?.session,
          error: error,
          data: data
        }
      } catch (e) {
        return { error: e, hasSession: false }
      }
    },
    cleanSupabaseAuth: () => {
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('supabase.auth.expires_at')
      localStorage.removeItem('supabase.auth.refresh_token')
      localStorage.removeItem('sb-access-token')
      localStorage.removeItem('sb-refresh-token')
      localStorage.removeItem('sb-user-id')
      localStorage.removeItem('sb-session-active')
      sessionStorage.removeItem('supabase.auth.token')
      return 'Auth storage cleaned.'
    }
  })
}

export { supabase }