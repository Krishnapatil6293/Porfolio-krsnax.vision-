-- ==============================================================================
-- KRISHNA PATIL — CINEMATIC VIDEO EDITOR PORTFOLIO SCHEMA & RLS POLICIES
-- ==============================================================================

-- 1. Enable pgcrypto / uuid-ossp if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROJECTS TABLE
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

-- Indexing for high-performance gallery filtering and sorting
CREATE INDEX IF NOT EXISTS idx_projects_published_sort ON public.projects(is_published, sort_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category);

-- 3. SITE SETTINGS TABLE
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
    skills JSONB DEFAULT '["Adobe Premiere Pro", "DaVinci Resolve Studio", "Adobe After Effects", "Final Cut Pro", "Color Grading", "Sound Design & Foley", "Pacing & Narrative Cutting", "Motion Graphics"]'::jsonb,
    social_links JSONB DEFAULT '{"instagram": "", "youtube": "", "linkedin": "", "vimeo": ""}'::jsonb,
    contact_email TEXT DEFAULT 'kpctech1234@gmail.com',
    contact_phone TEXT DEFAULT '7066397018',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. INQUIRIES TABLE
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
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- PROJECTS POLICIES:
-- 1. Anyone (anonymous + authenticated) can view published projects
CREATE POLICY "Public visitors can view published projects"
    ON public.projects
    FOR SELECT
    USING (is_published = true OR auth.role() = 'authenticated');

-- 2. Only authenticated administrators can create, update, or delete projects
CREATE POLICY "Only authenticated admin can insert projects"
    ON public.projects
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Only authenticated admin can update projects"
    ON public.projects
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Only authenticated admin can delete projects"
    ON public.projects
    FOR DELETE
    TO authenticated
    USING (true);

-- SITE SETTINGS POLICIES:
-- 1. Public can read site settings
CREATE POLICY "Public can view site settings"
    ON public.site_settings
    FOR SELECT
    USING (true);

-- 2. Only authenticated administrators can update settings
CREATE POLICY "Only authenticated admin can update site settings"
    ON public.site_settings
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- INQUIRIES POLICIES (STRICT SECURITY):
-- 1. Public can insert new inquiries (Client Inquiry form)
CREATE POLICY "Public visitors can submit inquiries"
    ON public.inquiries
    FOR INSERT
    TO public
    WITH CHECK (
        length(name) >= 2 AND 
        length(email) >= 5 AND 
        length(brief) >= 10
    );

-- 2. CRITICAL: Public CANNOT SELECT inquiries under any circumstances!
-- Only authenticated administrators can read inquiries.
CREATE POLICY "Only authenticated admin can view inquiries"
    ON public.inquiries
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only authenticated admin can update inquiries"
    ON public.inquiries
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- STORAGE BUCKETS SETUP & SECURITY POLICIES
-- ==============================================================================

-- Note: Storage buckets can be created in the Supabase Dashboard or via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('portfolio-videos', 'portfolio-videos', true, 5368709120, ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska']),
    ('portfolio-thumbnails', 'portfolio-thumbnails', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
    ('profile-media', 'profile-media', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS: Public read access for portfolio assets
CREATE POLICY "Public Access To Portfolio Videos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'portfolio-videos');

CREATE POLICY "Public Access To Thumbnails"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'portfolio-thumbnails');

CREATE POLICY "Public Access To Profile Media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-media');

-- Storage RLS: Authenticated Admin Upload & Deletion only
CREATE POLICY "Authenticated users can upload portfolio videos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'portfolio-videos');

CREATE POLICY "Authenticated users can update/delete portfolio videos"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'portfolio-videos');

CREATE POLICY "Authenticated users can upload thumbnails"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'portfolio-thumbnails');

CREATE POLICY "Authenticated users can update/delete thumbnails"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'portfolio-thumbnails');

CREATE POLICY "Authenticated users can upload profile media"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'profile-media');

CREATE POLICY "Authenticated users can update/delete profile media"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'profile-media');

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
