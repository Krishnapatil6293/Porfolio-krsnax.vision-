# DEPLOYMENT GUIDE — KRISHNA PATIL PORTFOLIO

This guide explains how to deploy the portfolio to production on Vercel, enforce production administrator authentication, and optimize video streaming delivery.

---

## 1. Deploying to Vercel

### Step 1: Connect Git Repository
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. In the [Vercel Dashboard](https://vercel.com/dashboard), click **"Add New Project"** and select your repository.

### Step 2: Configure Project Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Configure Environment Variables
In the Vercel project settings under **Environment Variables**, add:

| Variable | Value | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://<your-ref>.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase publishable anonymous key |
| `VITE_DEV_ADMIN_ENABLED` | `false` | **CRITICAL**: Enforces strict Supabase Auth login |

### Step 4: Single Page Application (SPA) Routing Configuration
Ensure `vercel.json` exists in the repository root to route all requests (`/work/:slug`, `/admin`) to `index.html`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 2. Production Administrator Authentication

### Creating Your Administrator Account
1. Go to your **Supabase Dashboard** -> **Authentication** -> **Users**.
2. Click **"Add user"** -> **"Create user"**.
3. Enter your email (`kpctech1234@gmail.com`) and choose a strong password.
4. Set **"Auto Confirm User?"** to `true`.

### How Production Security Works
- When `VITE_DEV_ADMIN_ENABLED` is `false` (or when running on a live production domain):
  - Access to `/admin` requires an active Supabase session.
  - Visitors navigating to `/admin` are presented with the secure Studio Administrator login screen.
  - Anonymous visitors cannot read inquiries or modify projects.
  - Supabase Row Level Security (RLS) guarantees that even if a visitor inspects network requests, mutations are rejected at the database layer.

---

## 3. High-Performance Video Delivery Architecture

### The Problem with Direct 2 GB Master Playback
- Master video files (such as Apple ProRes 422 HQ or uncompressed 4K exports) can be 1–2 GB in size.
- Direct web streaming of a 2 GB file will cause:
  - Heavy buffering on mobile networks
  - Massive browser bandwidth consumption
  - Rapid exhaustion of Supabase egress bandwidth limits

### The Multi-Tier Delivery Solution
1. **Original Asset Preservation**:
   - The original 1–2 GB file is stored in `portfolio-videos` as the source master.
   - Preserved in PostgreSQL under `original_video_path`.
2. **Web-Ready Presentation**:
   - The web gallery cards use lightweight WebP/JPEG thumbnails with `preload="none"`.
   - Video media containers are **never** loaded until the visitor explicitly clicks to view.
3. **Dedicated Video CDN Integration (Recommended for Scale)**:
   - For high-volume visitor traffic, configure a dedicated video processing pipeline such as:
     - **Cloudflare Stream**: Automatic HLS adaptive bitrate streaming (~$5/mo).
     - **Bunny.net Stream**: Ultra-low egress costs ($0.005/GB).
     - **Mux Video**: Developer-first video transcoding.
   - In the Studio Admin, you can simply paste the CDN stream URL into `playback_video_path` without touching any code!
