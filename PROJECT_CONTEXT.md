# PROJECT CONTEXT — KRISHNA PATIL PORTFOLIO

## Overview
A bespoke, high-performance, cinematic personal portfolio and client-acquisition platform for **Krishna Patil**, Professional Video Editor.
Designed with deep charcoal/graphite aesthetics, precision typography, layered video-frame composition, interactive gallery with 3D tilt, detail modal & routes, robust contact inquiry system, and a comprehensive admin management dashboard.

---

## Technical Stack & Architecture

### Frontend
- **Framework**: React 19, TypeScript, Vite
- **Routing**: React Router v7 (`react-router-dom`)
  - `/` — Main Cinematic Portfolio (Hero, Selected Work Bento, Creative Process, About Krishna, Inquiries/Contact, Footer)
  - `/work/:slug` — Deep-dive Project Detail Page (Cinematic player, editing technique breakdown, tools, before-and-after comparison, related edits)
  - `/admin` — Secure Admin Control Center (Project Manager, TUS Resumable Video Uploader, Site Profile Editor, Inquiry Manager)
- **Styling**: Tailwind CSS + Custom CSS Design System (cinematic dark mode, noise texture, smooth glassmorphic blur, hairline graphite borders, glowing accents)
- **Icons**: Lucide React
- **Animations**: Framer Motion / Motion for React with `prefers-reduced-motion` compliance
- **Forms & Validation**: React Hook Form + Zod validation

### Backend & Data Layer (Supabase PostgreSQL + Storage)
- **Database Tables**:
  - `projects`: Project records (id, title, slug, description, category, tags, client_name, project_date, thumbnail_path, original_video_path, playback_video_path, video_duration_seconds, video_size_bytes, is_featured, is_published, sort_order, created_at, updated_at)
  - `site_settings`: Global profile and portfolio content (portrait_path, bio, headline, subheadline, skills, social_links, available_for_work)
  - `inquiries`: Client contact submissions (name, email, project_type, budget_range, brief, deadline, status, created_at)
- **Storage Buckets**:
  - `portfolio-videos`: Source & playback video assets
  - `portfolio-thumbnails`: Optimized image posters/covers
  - `profile-media`: Admin/editor portrait and branding assets
- **Data Layer Architecture**:
  - `src/lib/supabase.ts`: Supabase client singleton with environment flag checks
  - `src/services/projectsService.ts`: CRUD operations with fallback to curated showcase data when Supabase is in mock/unconnected mode
  - `src/services/siteSettingsService.ts`: Site configuration retrieval and updates
  - `src/services/inquiriesService.ts`: Public rate-limited submission and authenticated admin inquiry viewer
  - `src/services/uploadService.ts`: TUS-based resumable large video uploader

---

## 1–2 GB Large Video Uploads & Supabase Plan Realities

### TUS Resumable Upload Implementation
- Employs `tus-js-client` configured against the Supabase Storage Resumable Upload endpoint (`https://<project-ref>.supabase.co/storage/v1/upload/resumable`).
- Uses standard 6 MiB (`6 * 1024 * 1024`) chunk sizes as required by Supabase Storage.
- Implements fingerprinting, exponential backoff retries, upload progress percentage reporting, upload speed estimation, and cancel/pause/resume capabilities.

### Supabase Plan Limits & Video Delivery Realities
- **Supabase Free Tier**: Maximum file size limit is **50 MB**. An attempt to upload 1–2 GB files on a Free tier project will be rejected by Supabase API gateway policies.
- **Supabase Pro Tier**: Default maximum file size limit is **5 GB** (configurable up to 50 GB via support request). 1–2 GB uploads require at least the Pro tier with custom bucket configuration (`file_size_limit`).
- **Egress & Bandwidth**: Direct streaming of 2 GB raw ProRes/master videos to casual mobile/web visitors will exhaust bandwidth quotas and cause playback buffering. Therefore:
  - We store `original_video_path` as the source archive.
  - We provide a dedicated `playback_video_path` field for compressed web-ready MP4/H.264 or HLS CDN URLs (such as Cloudflare Stream, Mux, or Bunny.net).
  - Web gallery uses `preload="none"` and serves high-res WebP/JPEG thumbnails rather than loading video containers until user clicks to play.

---

## Security Model & Development Mode Access
- **Local Development Mode**: Controlled via `VITE_DEV_ADMIN_ENABLED="true"` strictly on `localhost` or preview. If disabled or in production, admin route requires authenticated session and fails closed.
- **Row Level Security (RLS)**:
  - `projects`: Public can SELECT published projects (`is_published = true`). All writes restricted to authenticated admin.
  - `site_settings`: Public can SELECT. Writes restricted to authenticated admin.
  - `inquiries`: Public can INSERT (with rate limiting / spam honeypot). Public CANNOT SELECT (prevents competitive intelligence or leak of other clients' contact info). Admin can SELECT and UPDATE status.
- **Secrets Management**: No `service_role` keys are ever exposed in frontend client code. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are used.
