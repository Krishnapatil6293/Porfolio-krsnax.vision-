# VERCEL DEPLOYMENT & PRODUCTION RUNBOOK — KRISHNA PATIL PORTFOLIO

This guide provides instructions for deploying your video editor portfolio to **Vercel**, configuring production environment variables, securing the Supabase Auth callback URLs, and delivering high-bitrate video assets at scale.

---

## 1. Deploying to Vercel (Step-by-Step)

### Step 1: Import GitHub Repository to Vercel
1. Log into your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** -> **"Project"**.
3. Under **"Import Git Repository"**, select your GitHub repository:
   - **Repository**: `Krishnapatil6293/Porfolio-krsnax.vision-`
4. Click **"Import"**.

### Step 2: Configure Project & Build Settings
Vercel automatically detects Vite. Confirm the following settings:
- **Framework Preset**: `Vite`
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Configure Environment Variables in Vercel
Before clicking **Deploy**, expand the **Environment Variables** section and add the following three variables for `Production`, `Preview`, and `Development`:

| Variable Name | Value | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://khaixytdbwmtrtfkfunp.supabase.co` | Live Supabase project endpoint |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_Q7a2cXVNY0UcwjW6T42nVQ_VD6twbzV` | Official Supabase publishable key |
| `VITE_DEV_ADMIN_ENABLED` | `false` | **CRITICAL**: Enforces strict Supabase Auth login |

> [!CAUTION]
> Ensure `VITE_DEV_ADMIN_ENABLED` is set to `false` in Vercel. Setting this to `false` guarantees that visitors navigating to `/admin` are presented with the secure login screen and that unauthenticated users cannot access management tools.

### Step 4: Click "Deploy"
1. Click **Deploy**. Vercel will install dependencies, execute `tsc -b && vite build`, and publish your website globally across its Edge Network.
2. Once the build completes, Vercel will assign your deployment a URL (e.g., `https://porfolio-krsnax-vision.vercel.app`).

---

## 2. Supabase Auth Configuration for Vercel

To ensure Supabase Auth redirects work reliably on your production domain:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/khaixytdbwmtrtfkfunp).
2. Navigate to **Authentication** -> **URL Configuration**.
3. Set **Site URL** to your Vercel production domain:
   ```
   https://your-portfolio-domain.vercel.app
   ```
4. In **Redirect URLs**, add:
   ```
   https://your-portfolio-domain.vercel.app/**
   https://*.vercel.app/**
   http://localhost:5173/**
   ```
5. Click **Save**.

---

## 3. SPA Routing & Deep Links (`vercel.json`)

Your repository includes a pre-configured `vercel.json` file in the root directory:
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
This rewrite rule ensures that direct visits or browser refreshes on routes such as `/work/tokyo-noir` or `/admin` are resolved to the Single Page Application router without returning `404 Not Found`.

---

## 4. Production Video Delivery & CDN Strategy

### How Video Delivery Operates:
1. **Gallery Experience**:
   - Project cards in the portfolio gallery use WebP/JPEG thumbnail posters.
   - Video elements use `preload="none"`, meaning zero video data is loaded when visitors browse the gallery.
2. **On-Demand Streaming**:
   - When a visitor clicks a video card, the player modal loads the specific video stream on demand.
3. **Master File vs. Streaming Renditions**:
   - The application separates `original_video_path` (your uncompressed 1–2 GB master stored in `portfolio-videos`) from `playback_video_path` (the web-optimized streaming version).
   - In the Studio Admin, you can provide an optimized playback URL directly.

### Recommended Video CDNs for High Visitor Volume:
If your portfolio experiences thousands of concurrent video plays, hosting 1–2 GB master files directly on Supabase Storage can consume egress bandwidth. You can connect:
- **Cloudflare Stream**: Upload master files for automatic adaptive-bitrate HLS streaming (~$5/mo).
- **Bunny.net Stream**: Global CDN with ultra-low egress ($0.005/GB).
- **Mux Video**: Instant video encoding and streaming.

Simply paste the streaming URL (HLS `.m3u8` or MP4 CDN link) into the **Playback Video URL** field when saving or editing a project in `/admin`.

---

## 5. Security & Pre-Launch Checklist

- [x] `.env.local` is added to `.gitignore` and has never been committed.
- [x] No `service_role` secret keys exist anywhere in frontend code or Git history.
- [x] Supabase Row Level Security (RLS) is enabled on all tables (`projects`, `site_settings`, `inquiries`, `admin_users`).
- [x] `public.is_admin()` SQL function protects all project mutations and inquiry reads.
- [x] Client contact inquiries are strictly private: public visitors cannot read other visitors' submissions.
- [x] TUS chunked uploads authenticate via active administrator Supabase session token.
