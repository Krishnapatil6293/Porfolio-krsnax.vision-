# SUPABASE SETUP & CONFIGURATION GUIDE — KRISHNA PATIL PORTFOLIO

This guide provides step-by-step instructions for provisioning your live Supabase PostgreSQL database, Storage buckets, Row Level Security (RLS) policies, Administrator Authentication, and configuring resumable 1–2 GB video uploads.

---

## 1. Project Credentials

Your Supabase project is configured with the following credentials:

- **Supabase Project URL**: `https://khaixytdbwmtrtfkfunp.supabase.co`
- **Supabase Publishable Key**: `sb_publishable_Q7a2cXVNY0UcwjW6T42nVQ_VD6twbzV`
- **TUS Resumable Upload Endpoint**: `https://khaixytdbwmtrtfkfunp.supabase.co/storage/v1/upload/resumable`

These are configured in `.env.local` for local development and in Vercel environment variables for production:
```env
VITE_SUPABASE_URL=https://khaixytdbwmtrtfkfunp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Q7a2cXVNY0UcwjW6T42nVQ_VD6twbzV
VITE_DEV_ADMIN_ENABLED=false
```

---

## 2. Storage Quota & 1–2 GB Master Video Upload Realities

> [!IMPORTANT]
> **Plan Limit Requirements**:
> - **Supabase Free Plan**: Hard upload limit of **50 MB** per object. Attempting to upload files > 50 MB will fail at the Supabase API Gateway with `413 Payload Too Large`.
> - **Supabase Pro Plan ($25/mo)**: By default supports up to **5 GB** per object upload via TUS, and includes 100 GB storage + 250 GB bandwidth egress.
> - **Action Required for 1–2 GB Uploads**: To upload 1–2 GB master video files, your Supabase project must be upgraded to **Pro** in the Supabase Dashboard under **Project Settings -> Subscription**.
> - In your bucket settings, ensure the file size limit for `portfolio-videos` is set to `5368709120` (5 GB).

---

## 3. Database Migration & RLS Execution (One-Click)

The database schema, RLS policies, indexes, and automatic admin provisioning trigger are contained in:
`supabase/migrations/20261016_init_schema.sql`

### How to apply this migration:
1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard/project/khaixytdbwmtrtfkfunp).
2. In the left navigation menu, click **SQL Editor**.
3. Click **"New query"** (or the **+** button).
4. Copy the entire contents of [`supabase/migrations/20261016_init_schema.sql`](file:///Users/krishnapatil/Downloads/Portfolio%20web/supabase/migrations/20261016_init_schema.sql) and paste into the editor.
5. Click **Run** (or press `Cmd + Enter` / `Ctrl + Enter`).
6. You will see `Success. No rows returned`. All tables, indexes, RLS policies, and storage buckets are now created.

---

## 4. What Was Created in Your Database

### Tables:
1. `public.admin_users`:
   - `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
   - `email TEXT UNIQUE NOT NULL`
   - `role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin'))`
   - Enforces least-privilege security: only verified admin accounts can access the dashboard.
2. `public.projects`:
   - Stores all video projects: `title`, unique `slug`, `description`, `category`, `tags`, `thumbnail_path`, `original_video_path`, `playback_video_path`, `video_duration_seconds`, `video_size_bytes`, `is_featured`, `is_published`, `sort_order`, `tools_used`, etc.
3. `public.site_settings`:
   - Global portfolio metadata (`editor_name`, `title`, `headline`, `subheadline`, `bio`, `philosophy`, `skills`, `contact_email`, etc.).
4. `public.inquiries`:
   - Private client submissions (`name`, `email`, `project_type`, `budget_range`, `brief`, `status`).

### Security & Row Level Security (RLS) Policies:
- **`public.is_admin()` Security Definer Function**:
  - Securely verifies whether the requesting `auth.uid()` exists in `public.admin_users`.
- **Public Permissions**:
  - Visitors can **only** read `published = true` projects and `site_settings`.
  - Visitors can **INSERT** an inquiry (with validation).
  - Visitors **CANNOT** read other visitors' inquiries.
  - Visitors **CANNOT** create, update, or delete any projects.
- **Admin Permissions**:
  - Only authenticated users with an entry in `admin_users` can insert/update/delete projects, manage inquiries, or upload/delete videos in storage.

---

## 5. Creating Your Administrator Account

To log into your admin dashboard (`/admin`), follow these steps:

### Option A: Via Supabase Dashboard (Recommended)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/khaixytdbwmtrtfkfunp) -> **Authentication** -> **Users**.
2. Click **"Add user"** -> **"Create user"**.
3. Enter:
   - **User Email**: `kpctech1234@gmail.com`
   - **Password**: *Choose a secure password*
   - Check **"Auto Confirm User?"** to `ON` (so no email confirmation is needed).
4. Click **"Create user"**.
5. **The automatic trigger (`handle_new_admin_user()`) will instantly insert your user ID into `public.admin_users` with the `admin` role!**

### Option B: If the User Was Already Created Before Running Migration
If you had already created the user in Auth before running the SQL script, run this quick query in the SQL Editor to grant admin access:
```sql
INSERT INTO public.admin_users (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'kpctech1234@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

---

## 6. Storage Buckets Verification

The SQL migration automatically creates the required buckets. In your Supabase Dashboard -> **Storage**, verify that you see:

1. **`portfolio-videos`**:
   - Public: `true` (for streaming playback)
   - Max file size: `5368709120` (5 GB)
   - Allowed MIME types: `video/mp4`, `video/quicktime`, `video/webm`, `video/x-matroska`
2. **`portfolio-thumbnails`**:
   - Public: `true`
   - Max file size: `20971520` (20 MB)
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/avif`
3. **`profile-media`**:
   - Public: `true`
   - Max file size: `20971520` (20 MB)

---

## 7. Large File Video Uploads (TUS Resumable)

The application uses `tus-js-client` configured with:
- Endpoint: `https://khaixytdbwmtrtfkfunp.supabase.co/storage/v1/upload/resumable`
- Chunk size: `6 * 1024 * 1024` (6 MiB chunks as required by Supabase Storage)
- Headers:
  - `apikey`: Supabase Publishable Key
  - `Authorization`: `Bearer <admin_jwt_access_token>`
  - `x-upsert`: `true`
- Retry delays: `[0, 3000, 5000, 10000, 20000]` for resilient network recovery
- Real-time tracking: uploaded bytes, total bytes, percentage, upload speed (MB/s), and estimated time remaining.
- Ability to pause, resume, or cancel at any moment.

---

## 8. Populating Initial Showcase Projects to Database

Once you sign in to `/admin` using `kpctech1234@gmail.com`:
1. In the top metrics banner, click the **"Sync Showcase To Supabase"** button.
2. This will upload the curated showcase edits (Tokyo Noir, Apex Kinetic, Urban Velocity, Echoes of the North, Spectral Prisms, Master of Time) directly into your live Supabase database with all their metadata, tags, and thumbnails!
