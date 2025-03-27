-- Create public profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  title TEXT,
  phone TEXT,
  location TEXT,
  experience TEXT,
  bio TEXT,
  specialties TEXT[],
  licenses TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_notes table for the Supabase example component
CREATE TABLE IF NOT EXISTS public.user_notes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for user_notes
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- Notes are viewable by their owners
CREATE POLICY "Notes are viewable by their owners" 
  ON public.user_notes FOR SELECT USING (
    auth.uid()::text = user_id::text
  );

-- Users can insert their own notes
CREATE POLICY "Users can insert their own notes" 
  ON public.user_notes FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text
  );

-- Users can update their own notes
CREATE POLICY "Users can update their own notes" 
  ON public.user_notes FOR UPDATE USING (
    auth.uid()::text = user_id::text
  );

-- Users can delete their own notes
CREATE POLICY "Users can delete their own notes" 
  ON public.user_notes FOR DELETE USING (
    auth.uid()::text = user_id::text
  );

-- Create trigger for updating timestamps for user_notes
CREATE TRIGGER update_user_notes_timestamp
BEFORE UPDATE ON public.user_notes
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Create RLS policies for profiles
-- Read access for everyone
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create social_accounts table
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id SERIAL PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, platform)
);

-- Create listings table for property listings
CREATE TABLE IF NOT EXISTS public.listings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(15, 2),
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  bedrooms INTEGER,
  bathrooms NUMERIC(4, 1),
  squareFeet INTEGER,
  yearBuilt INTEGER,
  propertyType TEXT,
  status TEXT DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  imageUrls TEXT[],
  amenities TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for listings
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Listings are viewable by everyone
CREATE POLICY "Listings are viewable by everyone" 
  ON public.listings FOR SELECT USING (true);

-- Users can insert their own listings
CREATE POLICY "Users can insert their own listings" 
  ON public.listings FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text
  );

-- Users can update their own listings
CREATE POLICY "Users can update their own listings" 
  ON public.listings FOR UPDATE USING (
    auth.uid()::text = user_id::text
  );

-- Users can delete their own listings
CREATE POLICY "Users can delete their own listings" 
  ON public.listings FOR DELETE USING (
    auth.uid()::text = user_id::text
  );

-- Create trigger for updating timestamps for listings
CREATE TRIGGER update_listings_timestamp
BEFORE UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Create RLS policies for social_accounts
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Social accounts are viewable by everyone" 
  ON public.social_accounts FOR SELECT USING (true);

-- Users can insert their own social accounts
CREATE POLICY "Users can insert their own social accounts" 
  ON public.social_accounts FOR INSERT WITH CHECK (
    auth.uid() = (SELECT id FROM public.profiles WHERE id = profile_id)
  );

-- Users can update their own social accounts
CREATE POLICY "Users can update their own social accounts" 
  ON public.social_accounts FOR UPDATE USING (
    auth.uid() = (SELECT id FROM public.profiles WHERE id = profile_id)
  );

-- Users can delete their own social accounts
CREATE POLICY "Users can delete their own social accounts" 
  ON public.social_accounts FOR DELETE USING (
    auth.uid() = (SELECT id FROM public.profiles WHERE id = profile_id)
  );

-- Create user_themes table for profile customization
CREATE TABLE IF NOT EXISTS public.user_themes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  primary_color TEXT DEFAULT '#4f46e5',
  secondary_color TEXT DEFAULT '#10b981',
  font_family TEXT DEFAULT 'Inter',
  border_radius TEXT DEFAULT 'medium',
  dark_mode BOOLEAN DEFAULT false,
  template TEXT DEFAULT 'ProfessionalTemplate',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for user_themes
ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;

-- Themes are viewable by everyone
CREATE POLICY "Themes are viewable by everyone" 
  ON public.user_themes FOR SELECT USING (true);

-- Users can insert their own themes
CREATE POLICY "Users can insert their own themes" 
  ON public.user_themes FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text
  );

-- Users can update their own themes
CREATE POLICY "Users can update their own themes" 
  ON public.user_themes FOR UPDATE USING (
    auth.uid()::text = user_id::text
  );

-- Create trigger for updating timestamps for user_themes
CREATE TRIGGER update_user_themes_timestamp
BEFORE UPDATE ON public.user_themes
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Create storage bucket for avatar images
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for uploading avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar image"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Only owners can update their avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_social_accounts_timestamp
BEFORE UPDATE ON public.social_accounts
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Set up auth hooks to create profile automatically after signup
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

-- Set up trigger to create user theme automatically after profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_themes (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  
-- Create the profile trigger
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();