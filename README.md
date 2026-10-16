# KRISHNA PATIL — CINEMATIC VIDEO EDITOR PORTFOLIO

A bespoke, high-performance personal portfolio and client acquisition platform engineered for **Krishna Patil**, Professional Video Editor.

Built with a dark cinematic creative studio aesthetic: deep charcoal and near-black surfaces, off-white typography, subtle film noise, 3D perspective media composition, interactive gallery with card tilts and video playback modal, comprehensive case study detail pages, client inquiry pipeline, and a full-featured studio admin dashboard supporting **resumable 1–2 GB video uploads** via TUS.

---

## ⚡ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4 + Custom Cinematic Design System (`src/index.css`)
- **Icons**: Lucide React
- **Video Player**: HTML5 Widescreen Player with `preload="none"`, responsive aspect ratios, and full playback controls
- **Upload Infrastructure**: Resumable chunked TUS transfers (`tus-js-client`) with 6 MiB chunking, real-time speed, pause/resume, and cancellation
- **Routing**: React Router v7 (`react-router-dom`) with lazy-loaded route chunks
- **Backend & Database**: Supabase PostgreSQL
- **Media Storage**: Supabase Storage (`portfolio-videos`, `portfolio-thumbnails`, `profile-media`)
- **Security**: Row Level Security (RLS) policies, honeypot spam protection, client rate limiting, and fail-closed admin authorization

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### 2. Installation
Clone or navigate to the repository directory and install dependencies:
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` settings:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://placeholder-project.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-anon-key-replace-with-real-supabase-credentials

# Studio Admin Development Bypass
# When true on localhost, allows direct testing of the Studio Admin dashboard
# When false in production, enforces Supabase Auth fail-closed policy
VITE_DEV_ADMIN_ENABLED=true
```
*Note: Even without live Supabase credentials, the portfolio runs immediately in **Local State Mode** with curated showcase projects, 6 high-res thumbnails, Krishna's actual portrait, and simulated TUS chunk uploads.*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## 📁 Key Routes

- `/` — Main Cinematic Portfolio:
  - Hero with 3D perspective media collage & availability badge
  - Selected Work Bento Gallery with category filters and interactive 3D tilt cards
  - Accessible Video Modal with native controls and case study links
  - Creative Process (01 Understand Story, 02 Shape Edit, 03 Refine Frame, 04 Deliver Cut)
  - About Krishna (real portrait, bio, philosophy, software toolchain)
  - Client Contact & Inquiries (direct email, phone, WhatsApp + form with spam protection)
  - Footer with dynamic year, navigation links, and back-to-top button
- `/work/:slug` — Individual Project Case Study Page:
  - Large widescreen cinematic player
  - Project overview & editing technique breakdown
  - Interactive Before & After color grading slider
  - Delivery specifications (ProRes 422 HQ, aspect ratio, audio master)
  - Related projects & contact CTA
- `/admin` — Studio Administrator Dashboard:
  - Overview metrics (published edits, drafts, total master data, unread inquiries)
  - Project Manager (search, filter, publish/unpublish toggle, edit metadata, delete)
  - Resumable 1–2 GB Video Upload Studio (drag-and-drop, 6 MiB chunking, progress bar, speed, pause/resume)
  - Site Profile Settings (update bio, headline, skills, photo URL, contact info)
  - Inquiries Manager (read client briefs, mark contacted/archived)

---

## 🗄️ Database Setup & Documentation

- See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for full SQL migrations, bucket setup, RLS policies, and file-size quota instructions.
- See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel deployment, production authentication, and video delivery CDN guidelines.
- See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for architecture decisions and technical considerations.
