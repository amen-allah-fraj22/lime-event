# LIME Event — Manual setup (Phase 1)

**Auth:** [Clerk](https://clerk.com)  
**Database:** [Supabase](https://supabase.com) Postgres only (not Supabase Auth)

---

## Where is `.env`?

Secrets are not committed. You create `.env` from the template:

| File | Purpose |
|------|---------|
| **`.env.example`** (root) | Template |
| **`.env`** (root) | Your secrets — **you create this** |
| **`apps/api/.env`** | Same copy — for `prisma migrate` |
| **`apps/web/.env.local`** | Clerk publishable key + API URL (Next.js) |

### Windows (PowerShell)

From `C:\Users\Negza\Desktop\lime-event`:

```powershell
Copy-Item .env.example .env
Copy-Item .env apps\api\.env
```

Create `apps\web\.env.local`:

```powershell
@"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
CLERK_SECRET_KEY=sk_test_YOUR_KEY
NEXT_PUBLIC_API_URL=http://localhost:3001
"@ | Set-Content apps\web\.env.local
```

Edit both files with your real Clerk keys.

---

## 1. Clerk (authentication)

1. [dashboard.clerk.com](https://dashboard.clerk.com) → **Create application** → `lime-event`
2. **User & authentication** → enable **Email** and **Google** (LinkedIn optional)
3. **API keys** → copy into `.env` and `apps/web/.env.local`:

| Clerk dashboard | Environment variable |
|-----------------|----------------------|
| Publishable key | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| Secret key | `CLERK_SECRET_KEY` |

4. **Webhooks** → Add endpoint:
   - Local (use [ngrok](https://ngrok.com)): `https://xxxx.ngrok.io/auth/webhook`
   - Production: `https://your-api.railway.app/auth/webhook`
   - Events: `user.created`, `user.updated`
   - Copy **Signing secret** → `CLERK_WEBHOOK_SECRET` in `.env`

5. **Paths** (Clerk → Paths): set sign-in URL `/sign-in`, sign-up URL `/sign-up`, after sign-in `/dashboard`

### Google OAuth — Client Secret in `.env`?

**No.** Put Google **Client ID** and **Client Secret** only in:

**Clerk → Configure → SSO connections → Google**

Clerk handles the OAuth flow. Your `.env` only needs Clerk keys (`pk_` / `sk_` / `whsec_`).

---

## 2. Supabase (database only)

1. [supabase.com](https://supabase.com) → **New project** → `lime-event`
2. **Do not** configure Supabase Authentication for app login (Clerk handles that).
3. **Project Settings → Database** → copy **Connection string** (URI) → `DATABASE_URL` in `.env` and `apps/api/.env`
4. Replace `[password]` with your database password. **URL-encode** special characters (`+` → `%2B`, `@` → `%40`, etc.).
5. Use the **direct** connection (`db.xxx.supabase.co:5432`) for migrations, not the pooler on port `6543`.
6. If the project was **paused**, open the Supabase dashboard and **Restore** it before migrating.

You do **not** need `NEXT_PUBLIC_SUPABASE_URL`, anon key, or JWT secret for Phase 1.

### Apply schema + seed (one command)

From the repo root (PowerShell):

```powershell
.\scripts\setup-db.ps1
# or: npm run db:setup
```

Verify database connectivity (start API first: `npm run dev:api`):

```powershell
curl http://localhost:3001/health/db
# → { "status": "ok", "database": "connected" }
```

**P1001 / can't reach database?** On many Windows/WiFi networks the direct host `db.*.supabase.co` is **IPv6-only** and unreachable. Use the **Session pooler** URI from Supabase Connect instead. Full guide: [`docs/SUPABASE-CONNECTION.md`](docs/SUPABASE-CONNECTION.md). Run `.\scripts\test-network.ps1` to confirm `TcpTestSucceeded: True`.

---

## 3. Database migration

```powershell
cd apps\api
npx prisma migrate dev --name init
npx prisma generate
```

The Prisma `User` model uses `clerk_user_id` (not `supabase_auth_id`). If you already migrated with the old column, create a new migration to rename it.

---

## 4. Row Level Security (optional)

With Clerk, all data access goes through the NestJS API. RLS is **optional** for MVP. See `IMPLEMENTATION_PLAN_PHASE1.md` §B1.4.

---

## 5. Role selection (Artist / Organizer / Agency)

After sign-up:

1. User picks a role on `/onboarding/role` (to be built) or during custom sign-up flow.
2. Store in Clerk `unsafeMetadata.role` (saved on onboarding page).
3. Webhook or `POST /auth/sync` creates the row in Postgres with matching `role`.

---

## 6. Fix `DATABASE_URL` (important)

If migrate fails with "invalid domain character", your Postgres password likely has special characters (`@`, `#`, `%`, etc.). **URL-encode** the password in the connection string, or reset the DB password to letters and numbers only in Supabase.

Example (password `P@ss#word` → encode as `P%40ss%23word`):

```
DATABASE_URL=postgresql://postgres:P%40ss%23word@db.xxx.supabase.co:5432/postgres
```

Then:

```powershell
cd apps\api
npx prisma migrate deploy
# or first time: npx prisma migrate dev --name init
```

## 7. Clerk webhook (local) — optional

**You do not need ngrok** for basic testing: after sign-up, `/onboarding/role` calls `POST /auth/sync`.

For automatic sync on sign-up, use ngrok. Step-by-step: [`docs/NGROK-SETUP.md`](docs/NGROK-SETUP.md).

1. Install: `winget install ngrok.ngrok` → `ngrok config add-authtoken YOUR_TOKEN`
2. Start API: `npm run dev:api`
3. Another terminal: `ngrok http 3001` → copy the `https://....ngrok-free.app` URL
4. Clerk → Webhooks → endpoint: `https://YOUR-ID.ngrok-free.app/auth/webhook`
5. Events: `user.created`, `user.updated` → copy signing secret → `CLERK_WEBHOOK_SECRET` in `apps/api/.env` (use quotes if secret contains `+`)

## 8. Install & run

```powershell
cd C:\Users\Negza\Desktop\lime-event
npm install --legacy-peer-deps
npm run dev:api   # http://localhost:3001/health
npm run dev:web   # http://localhost:3000
```

**Test flow**

1. Open http://localhost:3000/sign-up
2. Create account → `/onboarding/role` → pick Organizer
3. Dashboard → Create event → Matches → Send request to an artist

Check DB user row: `cd apps\api` then `npx prisma studio`.

---

## 9. Stitch UI

Stitch HTML is in `stitch_lime_event/` — React pages already use the same design. See `apps/web/src/components/lime/README.md`.  
Logo: `apps/web/public/logo.jpeg`

---

## 10. Deployment

Staging only until you send **APPROVED** for production (`IMPLEMENTATION_PLAN_PHASE1.md` §B3).

**Railway (API):**
- Required: `CLERK_SECRET_KEY`, `DATABASE_URL`
- Required before the real frontend can reach the API: `CORS_ORIGIN` — comma-separated
  allowlist (e.g. `https://your-app.vercel.app`). Without it the API only accepts requests
  from `http://localhost:3000` and will reject the deployed frontend entirely — this is a
  fail-closed default, not a bug, but it's easy to forget on first deploy.
- Optional: `CLERK_WEBHOOK_SECRET` (Clerk user-sync webhook), `RESEND_API_KEY` (email
  notifications — without it, only in-app notifications are sent), `GOOGLE_CLIENT_ID` /
  `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` (Google Calendar sync — the redirect URI
  must be registered on the Google OAuth client and point at the *frontend's*
  `/agenda/callback` route on whichever domain is live), `UPLOAD_PUBLIC_BASE_URL`

**Vercel (web):**
- Required: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (Next.js middleware runs
  server-side and needs this too, not just the API), `NEXT_PUBLIC_API_URL` (the Railway URL)
- Optional: `NEXT_PUBLIC_APP_URL` (used for canonical/Open Graph URLs — set it or social
  share previews will use relative/incorrect URLs)

See `.env.example` for the full list with descriptions.
