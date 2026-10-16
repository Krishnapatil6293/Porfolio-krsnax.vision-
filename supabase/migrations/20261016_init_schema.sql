-- ==============================================================================
-- KRISHNA PATIL — CINEMATIC VIDEO EDITOR PORTFOLIO SCHEMA & SECURE RLS POLICIES
-- Target Supabase Project: https://khaixytdbwmtrtfkfunp.supabase.co
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ADMIN USERS TABLE (Strict Role-Based Access Control)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for instant role lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_lookup ON public.admin_users(id, role);

-- Secure Database Helper Function to verify Administrator privileges
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  );
$$;

-- 3. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    client_name TEXT,
    project_date TEXT,
    thumbnail_path TEXT NOT NULL,
    original_video_path TEXT NOT NULL,
    playback_video_path TEXT,
    video_duration_seconds INTEGER,
    video_size_bytes BIGINT,
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    role_description TEXT,
    tools_used TEXT[] DEFAULT '{}',
    before_after_enabled BOOLEAN DEFAULT false,
    before_thumbnail_path TEXT,
    after_thumbnail_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for gallery filtering, sorting, and slugs
CREATE INDEX IF NOT EXISTS idx_projects_published_sort ON public.projects(is_published, sort_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);

-- 4. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    editor_name TEXT NOT NULL DEFAULT 'Krishna Patil',
    title TEXT NOT NULL DEFAULT 'Professional Video Editor',
    headline TEXT NOT NULL DEFAULT 'Every Frame Has a Story.',
    subheadline TEXT NOT NULL DEFAULT 'I’m Krishna Patil, a video editor crafting cinematic visuals, compelling stories, and edits that leave an impression.',
    bio TEXT NOT NULL,
    philosophy TEXT NOT NULL,
    portrait_url TEXT DEFAULT '/krishna-patil.jpg',
    availability_status TEXT DEFAULT 'Available for select projects',
    skills JSONB DEFAULT '["Adobe Premiere Pro", "DaVinci Resolve Studio", "Adobe After Effects", "Final Cut Pro", "Color Grading & ACES", "Sound Design & Foley", "Pacing & Narrative Cutting", "Motion Graphics"]'::jsonb,
    social_links JSONB DEFAULT '{"instagram": "", "youtube": "", "linkedin": "", "vimeo": ""}'::jsonb,
    contact_email TEXT DEFAULT 'kpctech1234@gmail.com',
    contact_phone TEXT DEFAULT '7066397018',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. INQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    project_type TEXT NOT NULL,
    budget_range TEXT,
    brief TEXT NOT NULL,
    deadline TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'archived')),
    ip_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- ADMIN USERS POLICIES
-- Users can check their own admin role
CREATE POLICY "Users can check own admin role"
    ON public.admin_users FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.is_admin());

-- PROJECTS POLICIES
-- 1. Public can read published projects; Admins can read all projects (including drafts)
CREATE POLICY "Public can view published projects"
    ON public.projects FOR SELECT
    USING (is_published = true OR public.is_admin());

-- 2. Mutations strictly restricted to verified administrators (NOT any random authenticated user)
CREATE POLICY "Only verified admin can insert projects"
    ON public.projects FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Only verified admin can update projects"
    ON public.projects FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Only verified admin can delete projects"
    ON public.projects FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- SITE SETTINGS POLICIES
-- Public can read site settings
CREATE POLICY "Public can view site settings"
    ON public.site_settings FOR SELECT
    USING (true);

-- Only verified admin can insert or update site settings
CREATE POLICY "Only verified admin can insert site settings"
    ON public.site_settings FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Only verified admin can update site settings"
    ON public.site_settings FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- INQUIRIES POLICIES (STRICT DATA PRIVACY)
-- Public can insert new project inquiry submissions
CREATE POLICY "Public visitors can submit inquiries"
    ON public.inquiries FOR INSERT
    TO public
    WITH CHECK (
        length(name) >= 2 AND 
        length(email) >= 5 AND 
        length(brief) >= 10
    );

-- CRITICAL: Public and ordinary users CANNOT read inquiries!
-- Only verified administrators can read client briefs:
CREATE POLICY "Only verified admin can view inquiries"
    ON public.inquiries FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Only verified admin can update inquiries"
    ON public.inquiries FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Only verified admin can delete inquiries"
    ON public.inquiries FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ==============================================================================
-- STORAGE BUCKETS SETUP & SECURITY POLICIES
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('portfolio-videos', 'portfolio-videos', true, 5368709120, ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska']),
    ('portfolio-thumbnails', 'portfolio-thumbnails', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
    ('profile-media', 'profile-media', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS: Public can view portfolio media
CREATE POLICY "Public Access To Portfolio Videos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'portfolio-videos');

CREATE POLICY "Public Access To Thumbnails"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'portfolio-thumbnails');

CREATE POLICY "Public Access To Profile Media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-media');

-- Storage RLS: Only verified administrators can upload, update, or delete media
CREATE POLICY "Admin upload portfolio videos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'portfolio-videos' AND public.is_admin());

CREATE POLICY "Admin manage portfolio videos"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'portfolio-videos' AND public.is_admin());

CREATE POLICY "Admin upload thumbnails"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'portfolio-thumbnails' AND public.is_admin());

CREATE POLICY "Admin manage thumbnails"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'portfolio-thumbnails' AND public.is_admin());

CREATE POLICY "Admin upload profile media"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'profile-media' AND public.is_admin());

CREATE POLICY "Admin manage profile media"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'profile-media' AND public.is_admin());

-- ==============================================================================
-- ADMINISTRATOR PROVISIONING FOR kpctech1234@gmail.com
--
-- RECOMMENDED SAFE MANUAL PROCEDURE:
-- 1. In Supabase Dashboard -> Authentication -> Providers -> Email, disable "Enable Email Signup"
--    so public visitors cannot create accounts.
-- 2. In Supabase Dashboard -> Authentication -> Users, click "Add user" -> "Create user":
--    Email: kpctech1234@gmail.com
--    Password: <your-secure-password>
--    Auto Confirm User: ON
-- 3. Execute this manual query to grant admin role:
--    INSERT INTO public.admin_users (id, email, role)
--    SELECT id, email, 'admin'
--    FROM auth.users
--    WHERE LOWER(email) = 'kpctech1234@gmail.com'
--    ON CONFLICT (id) DO UPDATE SET role = 'admin';
-- ==============================================================================

-- Convenience trigger for new user creation (hardened with case-insensitive check):
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF LOWER(NEW.email) = 'kpctech1234@gmail.com' THEN
    INSERT INTO public.admin_users (id, email, role)
    VALUES (NEW.id, LOWER(NEW.email), 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_user();

-- ==============================================================================
-- INITIAL SEED DATA FOR SITE SETTINGS
-- ==============================================================================
INSERT INTO public.site_settings (
    id,
    editor_name,
    title,
    headline,
    subheadline,
    bio,
    philosophy,
    portrait_url,
    availability_status,
    skills,
    contact_email,
    contact_phone
) VALUES (
    'global',
    'Krishna Patil',
    'Professional Video Editor',
    'Every Frame Has a Story.',
    'I’m Krishna Patil, a video editor crafting cinematic visuals, compelling stories, and edits that leave an impression.',
    'With a deep passion for narrative flow, visual rhythm, and cinematic color science, I transform raw footage into captivating visual experiences. From commercial brand films and dynamic short-form reels to immersive narrative documentaries, every cut is deliberate and crafted with precision.',
    'Editing is not merely joining clips; it is the rhythm of emotion, timing, and perspective. I obsess over micro-cadence, sonic impact, and visual tone to ensure that every frame serves the core narrative.',
    '/krishna-patil.jpg',
    'Available for select projects',
    '["Adobe Premiere Pro", "DaVinci Resolve Studio", "Adobe After Effects", "Final Cut Pro", "Color Grading & ACES", "Sound Design & Foley", "Pacing & Narrative Cutting", "Motion Graphics & Compositing"]'::jsonb,
    'kpctech1234@gmail.com',
    '7066397018'
) ON CONFLICT (id) DO NOTHING;
