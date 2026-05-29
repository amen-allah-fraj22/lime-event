# Phase 1 — Status

**Last updated:** May 2026  
**Stack:** Next.js 14 · NestJS · Supabase Postgres · Clerk

## Complete (MVP scope)

### Backend
- [x] Monorepo, Prisma schema, migrations, seed (3 demo artists)
- [x] Clerk auth guards + webhook + `POST /auth/sync`
- [x] All core API domains (users, artists, events, bookings, contracts, payments, notifications, ratings, admin, calendar)
- [x] Filter matching `GET /events/:id/matches`
- [x] Contract HTML templates + sign flow
- [x] Payment commission logic (12.5%)
- [x] In-app notifications
- [x] `GET /booking-requests` list for dashboard
- [x] Auto-create contract when organizer accepts quote
- [x] Jest unit tests (payments, bookings auth)

### Frontend
- [x] Clerk sign-in / sign-up / onboarding role
- [x] **Stitch full landing** (`LIME Event Landing Page (Full)` → `/`)
- [x] **Stitch auth layout** (`login_signup` → `/sign-in`, `/sign-up` + role tabs)
- [x] Browse artists, artist profile, artist edit
- [x] Create event → matches → send booking request
- [x] Booking detail (quote, accept, messages, contract link)
- [x] Contract preview + signature canvas
- [x] Dashboard with bookings list
- [x] Calendar, notifications, admin (stats + users + bookings + payments)
- [x] LIME design tokens + AppShell

### Infrastructure (local)
- [x] Session pooler `DATABASE_URL` (IPv4-friendly)
- [x] `npm run db:setup`, health endpoints

## Not in Phase 1 (by design or deferred)

| Item | Notes |
|------|--------|
| Puppeteer PDF export | HTML preview at `GET /contracts/:id/pdf` instead |
| Resend email | Optional; in-app notifications work without `RESEND_API_KEY` |
| Playwright E2E | Not added; manual test flow in `SETUP.md` |
| Full Stitch HTML → React port | Core flows built; not every Stitch screen |
| Production deploy | Requires your **APPROVED** (Railway + Vercel) |
| ngrok / Clerk webhook | Optional; `/auth/sync` on onboarding is enough locally |

## End-to-end test flow

1. Sign up → pick **Organizer** on `/onboarding/role`
2. **Create event** → **Matches** → **Send request** to a demo artist
3. Sign in as artist (or use second browser) → **Dashboard** → open booking → **Send quote**
4. As organizer → **Accept quote** → **Sign contract** (both parties)
5. Browse `/artists`, `/notifications`, `/calendar`

### Admin access

In Prisma Studio: set your `User.role` to `admin`, then open `/admin`.

## Commands

```powershell
npm run dev:api
npm run dev:web
npm run test:api
npm run db:setup   # after schema changes
```
