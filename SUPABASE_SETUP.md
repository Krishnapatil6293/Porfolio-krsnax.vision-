# SUPABASE SETUP & CONFIGURATION GUIDE — KRISHNA PATIL PORTFOLIO

This guide provides step-by-step instructions for provisioning your Supabase PostgreSQL database, Storage buckets, Row Level Security (RLS) policies, and setting up resumable 1–2 GB video uploads.

---

## 1. Supabase Plan Limits & Realities for 1–2 GB Video Uploads

> [!IMPORTANT]
> **Plan Limitation Warning**:
> - **Supabase Free Tier**: Configured with a hard maximum file upload limit of **50 MB** per object. Attempting to upload 1–2 GB video files on the Free tier will fail at the API gateway with `413 Payload Too Large`.
> - **Supabase Pro Tier ($25/mo)**: Supports file uploads up to **5 GB** per object by default (expandable up to 50 GB upon request to Supabase support).
> - **Requirement for 1–2 GB Uploads**: To reliably store 1–2 GB master video files, your Supabase project **must be on the Pro tier** or higher, with the bucket `file_size_limit` configured appropriately.

---

## 2. Storage Buckets Creation

In your Supabase project dashboard, navigate to **Storage** and create the following three buckets:

| Bucket Name | Public Access | Allowed File Types | File Size Limit |
|---|---|---|---|
| `portfolio-videos` | **Public** (or Private with signed URLs) | `video/mp4`, `video/quicktime`, `video/webm` | `5368709120` (5 GB) |
| `portfolio-thumbnails` | **Public** | `image/jpeg`, `image/png`, `image/webp` | `20971520` (20 MB) |
| `profile-media` | **Public** | `image/jpeg`, `image/png`, `image/webp` | `20971520` (20 MB) |

---

## 3. Database Schema & RLS Execution

Open the **SQL Editor** in your Supabase Dashboard, create a new query, and run the contents of `supabase/migrations/20261016_init_schema.sql`:

```sql
-- Enables UUID generator
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Projects Table
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

-- Indexes for lightning fast gallery loads
CREATE INDEX IF NOT EXISTS idx_projects_published ON public.projects(is_published, sort_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);

-- 2. Site Settings Table
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
    skills JSONB DEFAULT '[]'::jsonb,
    social_links JSONB DEFAULT '{}'::jsonb,
    contact_email TEXT DEFAULT 'kpctech1234@gmail.com',
    contact_phone TEXT DEFAULT '7066397018',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Inquiries Table
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    project_type TEXT NOT NULL,
    budget_range TEXT,
    brief TEXT NOT NULL,
    deadline TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Row Level Security (RLS) Rules

Enable RLS on all tables and apply least-privilege security policies:

```sql
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- PROJECTS
-- Anyone can view published projects
CREATE POLICY "Public can view published projects"
    ON public.projects FOR SELECT
    USING (is_published = true OR auth.role() = 'authenticated');

-- Only authenticated administrator can create, update, or delete
CREATE POLICY "Admin can modify projects"
    ON public.projects FOR ALL
    TO authenticated
    USING (true);

-- SITE SETTINGS
CREATE POLICY "Public can view site settings"
    ON public.site_settings FOR SELECT
    USING (true);

CREATE POLICY "Admin can update site settings"
    ON public.site_settings FOR UPDATE
    TO authenticated
    USING (true);

-- INQUIRIES (CRITICAL PRIVACY)
-- Public can INSERT their own inquiry
CREATE POLICY "Public can submit inquiries"
    ON public.inquiries FOR INSERT
    TO public
    WITH CHECK (length(name) >= 2 AND length(email) >= 5 AND length(brief) >= 10);

-- Public CANNOT view other client inquiries. Only authenticated admin can view:
CREATE POLICY "Admin can read inquiries"
    ON public.inquiries FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin can manage inquiries"
    ON public.inquiries FOR UPDATE
    TO authenticated
    USING (true);
```

---

## 5. Storage Security Policies

```sql
-- Allow public viewing of portfolio media
CREATE POLICY "Public Portfolio Video Access"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('portfolio-videos', 'portfolio-thumbnails', 'profile-media'));

-- Restrict uploads and deletions strictly to authenticated administrators
CREATE POLICY "Admin Uploads"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id IN ('portfolio-videos', 'portfolio-thumbnails', 'profile-media'));

CREATE POLICY "Admin Deletions"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id IN ('portfolio-videos', 'portfolio-thumbnails', 'profile-media'));
```

---

## 6. Connecting Your Frontend

In your local `.env` or production deployment dashboard:
```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
VITE_DEV_ADMIN_ENABLED=false
```

Never place `service_role` secrets in frontend client code.
