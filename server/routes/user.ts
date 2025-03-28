import { Express, Request, Response } from 'express';
import { supabaseAuth } from './auth';
import { supabase } from '../supabase-client';

export function registerUserRoutes(app: Express) {
  // Get current user profile
  app.get('/api/user', async (req: Request, res: Response) => {
    try {
      // First check if user is authenticated through Supabase
      let user;
      
      // Try to get user from Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data.user) {
          user = data.user;
        }
      }
      
      // If no user from token, check if user is set via middleware
      if (!user && (req as any).user) {
        user = (req as any).user;
      }
      
      // If still no user, check session
      if (!user) {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session) {
          user = data.session.user;
        }
      }
      
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Get profile data from Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }
      
      // Combine user and profile data
      const userData = {
        id: user.id,
        email: user.email,
        username: profileData?.username || user.user_metadata?.username || user.email?.split('@')[0],
        fullName: profileData?.full_name || user.user_metadata?.full_name || '',
        emailVerified: !!user.email_confirmed_at,
        profileImage: profileData?.avatar_url || '',
        title: profileData?.title || '',
        phone: profileData?.phone || '',
        location: profileData?.location || '',
        bio: profileData?.bio || '',
        experience: profileData?.experience || '',
        specialties: profileData?.specialties || [],
        licenses: profileData?.licenses || []
      };
      
      return res.json(userData);
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Other user routes...
} 