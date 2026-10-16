# KRISHNA PATIL — CINEMATIC VIDEO EDITOR PORTFOLIO

A bespoke, high-performance personal portfolio and client acquisition platform engineered for **Krishna Patil**, Professional Video Editor.

Built with a dark cinematic creative studio aesthetic: deep charcoal and near-black surfaces, subtle film noise, 3D perspective media composition, interactive Bento gallery with 3D card tilt and responsive video player modal, before-and-after color grading comparison slider, client inquiry pipeline, and a full-featured studio admin dashboard supporting **resumable 1–2 GB video uploads** via TUS.

---

## ⚡ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4 + Custom Cinematic Design System (`src/index.css`)
- **Icons**: Lucide React
- **Video Player**: HTML5 Widescreen Player with `preload="none"`, responsive aspect ratios, and full playback controls
- **Upload Infrastructure**: Resumable chunked TUS transfers (`tus-js-client`) with 6 MiB chunking, real-time speed, pause/resume, and cancellation
- **Routing**: React Router v7 (`react-router-dom`) with lazy-loaded route chunks
- **Backend & Database**: Supabase PostgreSQL (`https://khaixytdbwmtrtfkfunp.supabase.co`)
- **Media Storage**: Supabase Storage (`portfolio-videos`, `portfolio-thumbnails`, `profile-media`)
- **Security**: Row Level Security (RLS) policies, `public.is_admin()` role verification, honeypot spam protection, and fail-closed admin authorization

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
Local development uses `.env.local` (which is git-ignored and never committed):
```env
VITE_SUPABASE_URL=https://khaixytdbwmtrtfkfunp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Q7a2cXVNY0UcwjW6T42nVQ_VD6twbzV
VITE_DEV_ADMIN_ENABLED=false
```
See `.env.example` for the public template.

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
  - Creative Process (01 Story, 02 Rhythm, 03 Grade, 04 Master)
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
  - Secure Administrator Sign-In (`kpctech1234@gmail.com`) via Supabase Auth
  - Overview metrics (published edits, drafts, total master data, unread inquiries)
  - 1-Click "Sync Showcase To Supabase" to populate live database
  - Project Manager (search, filter, publish/unpublish toggle, edit metadata, delete)
  - Resumable 1–2 GB Video Upload Studio (drag-and-drop, 6 MiB chunking, progress bar, speed, pause/resume)
  - Site Profile Settings (update bio, headline, skills, photo URL, contact info)
  - Inquiries Manager (read client briefs, mark contacted/archived)

---

## 🗄️ Database Setup & Documentation

- See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for full SQL migrations (`supabase/migrations/20261016_init_schema.sql`), bucket setup, RLS policies, and 1–2 GB file-size quota instructions.
- See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel deployment, environment variables, production authentication, and video delivery CDN guidelines.
- See [TEST_REPORT.md](TEST_REPORT.md) for the automated build and verification checklist.
