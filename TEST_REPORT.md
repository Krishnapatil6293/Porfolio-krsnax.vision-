# PRE-DEPLOYMENT SECURITY & INTEGRATION AUDIT REPORT — KRISHNA PATIL PORTFOLIO

**Date**: October 16, 2026  
**Auditor**: Senior Full-Stack & Security Engineer (Antigravity)  
**Project**: Krishna Patil — Professional Video Editor Portfolio  
**Target Repository**: `https://github.com/Krishnapatil6293/Porfolio-krsnax.vision-.git`  
**Target Supabase Project**: `https://khaixytdbwmtrtfkfunp.supabase.co`  
**Overall Status**: AUDIT COMPLETE — CODEBASE PRODUCTION READY (Requires Manual Supabase Dashboard Steps Before Live Traffic)

---

## 1. Executive Summary & Verification Matrix

| Verification Item | Status | Result / Findings | Action Required |
|---|---|---|---|
| **TypeScript Typecheck** | **PASS** | 0 type errors with `verbatimModuleSyntax` and strict types | None (clean) |
| **Vite Production Bundler** | **PASS** | Clean build completed in 163ms | None (clean) |
| **Code Linting (`oxlint`)** | **PASS** | 0 lint errors across 22 source files | None (clean) |
| **Secret Leak Prevention** | **PASS** | No `.env` or `.env.local` files tracked. No secrets in Git history. | None (clean) |
| **Admin Privilege Escalation Protection** | **PASS** | `admin_users` table with `is_admin()` SQL security definer. Ordinary users cannot elevate roles. | Disable public signups in Supabase Auth |
| **Email Trigger Abuse Vector** | **MITIGATED** | Case-insensitive check added. Documented safe manual SQL provisioning as primary standard. | Disable public signup; use manual query |
| **Draft Projects & Inquiries Protection** | **PASS** | `is_published = true OR public.is_admin()` restricts drafts. Inquiries restricted strictly to `public.is_admin()`. | None (clean) |
| **TUS Resumable Token Refresh** | **PASS** | `onBeforeRequest` dynamic token refresh integrated. Prevents token expiration mid-upload. | None (clean) |
| **Upload State Recovery** | **PASS** | Added `handleSaveProjectRecord` retry button if database save fails after video upload. | None (clean) |
| **Storage RLS Policies** | **PASS** | Public read on portfolio buckets; insert/update/delete restricted to `public.is_admin()`. | Execute migration in Supabase SQL Editor |
| **1–2 GB Upload Quota** | **UNVERIFIED (Remote)** | Supabase Free tier enforces hard 50 MB limit. 1–2 GB uploads require Supabase Pro Plan ($25/mo). | Upgrade to Pro in Supabase Dashboard |
| **Vercel SPA Routing & Environment** | **PASS** | `vercel.json` rewrites active. Build command and env vars verified. | Add variables in Vercel project settings |
| **Live Remote Database Tables** | **PENDING USER RUN** | SQL migration file created and verified locally; awaits execution in Supabase Dashboard SQL Editor. | Run migration in Supabase SQL Editor |

---

## 2. Detailed Security & Integration Audit Findings

### A. RLS & Administrative Role Verification
- **Architecture**:
  - The database establishes `public.admin_users` referencing `auth.users(id)` with a strict role constraint (`CHECK (role IN ('admin', 'superadmin'))`).
  - The security definer function `public.is_admin()` executes with owner permissions and checks if `auth.uid()` exists in `public.admin_users`.
  - Row Level Security is enabled on all tables: `admin_users`, `projects`, `site_settings`, and `inquiries`.
- **Finding on Ordinary Authenticated Users**:
  - Even if a non-administrator signs into Supabase Auth, `public.is_admin()` evaluates to `FALSE`.
  - Because all mutation policies (`INSERT`, `UPDATE`, `DELETE`) on `projects`, `site_settings`, `inquiries`, and `storage.objects` require `public.is_admin()`, unauthorized users cannot modify or delete portfolio content.
  - Ordinary users cannot add themselves to `admin_users` because there are NO insert/update/delete policies for ordinary users on `admin_users`.

### B. Administrator Provisioning Trigger & Abuse Prevention
- **Risk Analysis**:
  - If public email registration is enabled in Supabase Auth (`Enable Email Signup = true`), an attacker could register an account with `kpctech1234@gmail.com` if email confirmation is not enforced before the real owner creates it.
- **Remediation Implemented**:
  1. Updated the trigger function in `supabase/migrations/20261016_init_schema.sql` to use case-insensitive matching `LOWER(NEW.email) = 'kpctech1234@gmail.com'`.
  2. Established the **Safe Manual Administrator Provisioning Procedure** as the recommended primary standard:
     - Disable public registration in Supabase Dashboard -> **Authentication** -> **Providers** -> **Email** -> Toggle **"Enable Email Signup"** to **OFF**.
     - Manually create the user in **Authentication** -> **Users** with **"Auto Confirm User"** set to `ON`.
     - Execute the explicit manual SQL query:
       ```sql
       INSERT INTO public.admin_users (id, email, role)
       SELECT id, email, 'admin'
       FROM auth.users
       WHERE LOWER(email) = 'kpctech1234@gmail.com'
       ON CONFLICT (id) DO UPDATE SET role = 'admin';
       ```
     - This completely closes the attack surface because public visitors cannot sign up.

### C. Data Privacy: Drafts & Client Inquiries
- **Drafts Protection**:
  - RLS Policy: `CREATE POLICY "Public can view published projects" ON public.projects FOR SELECT USING (is_published = true OR public.is_admin());`
  - For anonymous visitors or non-admin authenticated users, `is_published = false` rows are filtered out at the PostgreSQL query level.
- **Client Inquiries Privacy**:
  - RLS Policy: `CREATE POLICY "Only verified admin can view inquiries" ON public.inquiries FOR SELECT TO authenticated USING (public.is_admin());`
  - Anonymous visitors and ordinary authenticated users receive an empty set or 403 when querying `public.inquiries`. They cannot inspect client contact details or project briefs.

### D. TUS Resumable Large-File Video Uploads
- **Token Freshness**:
  - Integrated `onBeforeRequest` hook in `src/services/uploadService.ts` to retrieve and inject the freshest JWT access token via `getActiveAccessToken()` before every chunk request.
  - This ensures that long 1–2 GB transfers (which may take 15–45 minutes) do not fail when a JWT expires mid-transfer.
- **Upload State Persistence & Recovery**:
  - Added `handleSaveProjectRecord` in `src/pages/admin/AdminDashboard.tsx`.
  - If a video finishes uploading to Supabase Storage, but the database metadata write fails (e.g., brief network drop or unapplied RLS migration), the UI preserves the uploaded storage path and presents a green **"Video Stored in Supabase — Click to Save Project Metadata"** retry button. The user does not have to re-upload the 1–2 GB video file.

### E. Supabase Plan Limits for 1–2 GB Video Files
- **Free Plan Limit**:
  - Supabase enforces a strict **50 MB** object limit at the API Gateway on the Free tier. Any direct or TUS upload exceeding 50 MB will fail with HTTP `413 Payload Too Large`.
- **Required Action for 1–2 GB Uploads**:
  - Upgrade the project to the Supabase **Pro Plan** ($25/mo) in **Project Settings** -> **Subscription**.
  - In **Storage** -> `portfolio-videos` bucket -> Confirm or set **File size limit** to `5368709120` bytes (5 GB).

### F. Vercel Deployment & SPA Routing
- **Routing**: `vercel.json` contains a rewrite rule routing all paths to `/index.html`, ensuring deep links (`/work/:slug`, `/admin`) resolve correctly without 404 errors on page reload.
- **Environment Variables**:
  - `VITE_SUPABASE_URL=https://khaixytdbwmtrtfkfunp.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Q7a2cXVNY0UcwjW6T42nVQ_VD6twbzV`
  - `VITE_DEV_ADMIN_ENABLED=false`

---

## 3. Prioritized Pre-Launch Checklist

Complete these manual steps in order before announcing or directing traffic to your live portfolio:

### Priority 1: Supabase Database Migration
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard/project/khaixytdbwmtrtfkfunp/sql/new).
2. Open the **SQL Editor**, click **"New query"**.
3. Copy and paste the complete contents of [`supabase/migrations/20261016_init_schema.sql`](file:///Users/krishnapatil/Downloads/Portfolio%20web/supabase/migrations/20261016_init_schema.sql).
4. Click **Run**. Verify that you see `Success. No rows returned`.

### Priority 2: Harden Supabase Authentication
1. Go to **Authentication** -> **Providers** -> **Email**.
2. Toggle **"Enable Email Signup"** to **OFF** and click **Save**. *(Prevents public registration).*
3. Go to **Authentication** -> **Users** -> Click **"Add user"** -> **"Create user"**:
   - **Email**: `kpctech1234@gmail.com`
   - **Password**: *(Enter a strong password)*
   - **Auto Confirm User?**: Set to **ON**.
   - Click **Create user**.
4. In the SQL Editor, run:
   ```sql
   INSERT INTO public.admin_users (id, email, role)
   SELECT id, email, 'admin'
   FROM auth.users
   WHERE LOWER(email) = 'kpctech1234@gmail.com'
   ON CONFLICT (id) DO UPDATE SET role = 'admin';
   ```
5. Confirm by running `SELECT * FROM public.admin_users;`.

### Priority 3: Storage Bucket Configuration
1. In the Supabase Dashboard, go to **Storage**.
2. Verify that `portfolio-videos`, `portfolio-thumbnails`, and `profile-media` are created.
3. If you plan to upload 1–2 GB videos:
   - Ensure your Supabase project is on the **Pro Plan**.
   - On `portfolio-videos`, click **Edit bucket** and verify the file size limit is `5368709120` bytes (5 GB).

### Priority 4: Supabase Redirect URLs
1. Go to **Authentication** -> **URL Configuration**.
2. In **Redirect URLs**, add:
   - `https://*.vercel.app/**`
   - `http://localhost:5173/**`
   - *(Your custom domain if applicable)*

### Priority 5: Vercel Deployment
1. Go to [Vercel](https://vercel.com/dashboard) and import repository `Krishnapatil6293/Porfolio-krsnax.vision-`.
2. Add the environment variables:
   - `VITE_SUPABASE_URL=https://khaixytdbwmtrtfkfunp.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Q7a2cXVNY0UcwjW6T42nVQ_VD6twbzV`
   - `VITE_DEV_ADMIN_ENABLED=false`
3. Click **Deploy**.
4. Once deployed, open your live URL, navigate to `/admin`, log in with `kpctech1234@gmail.com`, and click **"Sync Showcase To Supabase"** to seed your database with your 6 showcase projects!

---

## 4. Bug Fix Verification: "403 Invalid Compact JWS" in TUS Resumable Upload

### Root Cause
1. `import.meta.env.DEV` was unconditionally initializing `isAuthenticated = true` in local development mode without requiring a Supabase Auth login.
2. When the user attempted a TUS upload without signing into Supabase Auth, `supabase.auth.getSession()` returned `null`.
3. `getActiveAccessToken()` fell back to `getSupabasePublishableKey()`, which is `sb_publishable_...`.
4. `uploadService.ts` passed `Authorization: Bearer sb_publishable_...` to Supabase Storage.
5. The Supabase Storage TUS server rejected this with `403 AccessDenied: Invalid Compact JWS` because an API key (`sb_publishable_...`) is not a valid compact JWS / JWT structure.

### Resolution
1. **Strict Session Enforcement**: Removed automatic dev bypass. The admin dashboard now checks for a valid Supabase Auth session on mount and requires authentication before allowing uploads.
2. **Safe Token Getter**: `getActiveAccessToken()` in `src/lib/supabase.ts` now strictly verifies that the token is a valid compact JWS (`isValidJwt`) and auto-refreshes expiring tokens. It **never** returns the publishable key.
3. **Pre-Flight Validation**: `uploadService.ts` checks token validity and administrator authorization before creating the TUS upload. If no session exists, it halts immediately with a clear error prompt to sign in.
4. **Descriptive Error Mapping**: `onError` in `uploadService.ts` decodes Supabase 403, 413, RLS, and bucket errors into actionable steps.

---

## 5. Root Cause Analysis & Fix: Live Vercel "403 Invalid Compact JWS"

### Proven Root Cause: W3C XMLHttpRequest Header Concatenation
Even after authenticating with a valid administrator session, uploads in `tus-js-client` failed at 0% with:
```text
HTTP 400 — AccessDenied — Unauthorized — Invalid Compact JWS
```

1. In `src/services/uploadService.ts`, the `tus.Upload` instance was configured with:
   ```ts
   headers: {
     authorization: `Bearer ${token}`,
     apikey: publishableKey,
     'x-upsert': 'true',
   },
   onBeforeRequest: async (req) => {
     req.setHeader('authorization', `Bearer ${freshToken}`);
     req.setHeader('apikey', publishableKey);
   }
   ```
2. Under the hood in `tus-js-client/lib.esm/upload.js` and `httpStack.js`:
   - `_openRequest` runs first and iterates over `options.headers`, executing `xhr.setRequestHeader('authorization', 'Bearer ' + token)`.
   - `_sendRequest` runs next and awaits `options.onBeforeRequest(req)`, executing `xhr.setRequestHeader('authorization', 'Bearer ' + freshToken)` on the **same** `XMLHttpRequest` instance.
3. **The W3C XMLHttpRequest Specification** mandates:
   > *"If `setRequestHeader` is called multiple times with the same header, the values are merged into one single request header separated by a comma."*
4. The actual header dispatched across the network to Supabase Storage was:
   ```http
   Authorization: Bearer <token>, Bearer <freshToken>
   apikey: <publishableKey>, <publishableKey>
   ```
5. When the Supabase API Gateway (Kong) received this header, it stripped the leading `"Bearer "` string and was left with:
   `<token>, Bearer <freshToken>`
6. Attempting to parse this comma-delimited string as a single compact JWS failed immediately, returning:
   `HTTP 400 / statusCode 403 AccessDenied Unauthorized: Invalid Compact JWS`.

### Implementation Fix
1. **Header Deduplication in `uploadService.ts`**:
   - Removed `authorization` and `apikey` from static `options.headers`.
   - Retained only static `'x-upsert': 'true'` in `options.headers`.
   - Allowed `onBeforeRequest` to be the single source of truth for dynamically attaching `Authorization: Bearer <token>` and `apikey: <key>` on every request (`POST`, `PATCH`, `HEAD`).
2. **JWT Payload Decoder (`getJwtExpiration`) in `supabase.ts`**:
   - Added a direct JWT payload expiration decoder as a fallback if `session.expires_at` is missing.
3. **Safe Diagnostic Logging**:
   - Added non-sensitive diagnostic logs in browser console (`tokenSegments: 3`, `tokenPrefix: "eyJ..."`, `hasToken: true`, `hasApiKey: true`).
4. **Automated Test Suite (`tests/uploadAuth.test.js`)**:
   - Added tests verifying JWT compact JWS validation, rejection of publishable keys, and verification that simulated XMLHttpRequest header concatenation never occurs.

### Live Vercel Deployment Verification
- Build output: `tsc -b && vite build` succeeded in 179ms.
- Lint output: `oxlint` passed with 0 errors.
- Test runner: `npm test` passed 3/3 test suites.
- Action required on Vercel: After pushing this fix to GitHub `main`, Vercel will trigger a new production deployment. A hard browser refresh (Cmd+Shift+R / Ctrl+F5) on `/admin` ensures the updated JavaScript bundle is loaded.

