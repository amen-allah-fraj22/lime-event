# LIME Event

**Fresh bookings, fresh talent.** — Music & event talent marketplace for Tunisia (Phase 1).

## Stack

- **Web:** Next.js 14, Tailwind, Clerk
- **DB:** Supabase Postgres (via Prisma)
- **API:** NestJS, Prisma, PostgreSQL (Supabase)
- **Phase 1:** Filter-based matching only (no OpenAI). Payment intents only (no live gateway).

## Quick start

1. Follow **[SETUP.md](./SETUP.md)** for Supabase, `.env`, and migrations.
2. Install dependencies:

```bash
npm install
```

3. Run API and web:

```bash
npm run dev:api
npm run dev:web
```

- API: http://localhost:3001/health  
- Web: http://localhost:3000  

## Stitch UI

Drop generated components into `apps/web/src/components/lime/`. See `IMPLEMENTATION_PLAN_PHASE1.md` Part A.

Logo: `apps/web/public/logo.jpeg`

## Docs

- [LIME_Event_PRD_v4.md](./LIME_Event_PRD_v4.md) — Product requirements  
- [IMPLEMENTATION_PLAN_PHASE1.md](./IMPLEMENTATION_PLAN_PHASE1.md) — Build plan  
- [deep-research-report.md](./deep-research-report.md) — Muzeek alignment & Tunisia context  

## Deployment

Staging only until a human approves production (see implementation plan §B3).
