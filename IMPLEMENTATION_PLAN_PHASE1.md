# LIME Event — Phase 1 Implementation Plan
**Version:** 1.0  
**Stack:** Next.js 14 · NestJS · Supabase (Postgres) · Clerk · Railway · Vercel  
**Auth:** Clerk (email + Google OAuth). Supabase = database only (not Supabase Auth).  
**AI:** None in Phase 1 (basic filters only)  
**Rule:** No production deployment without explicit human approval.

---

# PART A — FOR THE HUMAN

## A1. Stitch Prompt for UI Generation

Copy and paste the following prompt into [Stitch](https://stitch2.ai):

---

> **Stitch Prompt — LIME Event UI**
>
> Generate a complete set of React UI components for a marketplace app called **LIME Event** — a music and talent booking platform for Tunisia.
>
> **Brand**
> - Product name: lime (lowercase wordmark)
> - Slogan: "Fresh bookings, Fresh talent."
> - Logo: I will place the logo file manually. Reserve a `<Logo />` placeholder component at the top-left of the navbar and on the landing hero. The logo is a half-lime with three seeds + wordmark "lime".
> - Primary color: `#b7d507` (lime green)
> - Text color: `#2E2E2E` (near-black)
> - Accent / muted: `#808080` (gray)
> - Background: `#F9F9F9` (off-white)
> - Use these exact hex values in all components.
>
> **Output format**
> - React functional components (TypeScript)
> - Tailwind CSS utility classes only (no inline styles)
> - shadcn/ui primitives where appropriate (Button, Input, Card, Dialog, Badge, Avatar, Tabs, Select, Textarea, Calendar)
> - Each component in its own file, named clearly (e.g. `ArtistProfileCard.tsx`, `EventCreationForm.tsx`)
> - No hardcoded API calls — accept all data via props
>
> **Components to generate:**
>
> 1. **AuthPages** — Signup and Login pages. Two-column layout: left side brand panel (logo + slogan on `#b7d507` background), right side form. Support email/password and a "Continue with Google" button. Role selector at signup: Artist / Organizer / Agency (pill toggle).
>
> 2. **ArtistProfilePage** — Public-facing profile. Hero section with cover photo area, avatar, name, city, genre badge chips, star rating + review count. Tabs: About / Portfolio / Pricing / Reviews. Portfolio embeds SoundCloud/YouTube/Spotify by URL. Pricing shows min–max range in TND. "Send Booking Request" CTA button (primary color).
>
> 3. **ArtistProfileEditForm** — Editable version of the profile. Fields: display name, bio, genres (multi-select tag input), city (dropdown), pricing min/max, portfolio links (add/remove rows), profile photo upload.
>
> 4. **EventCreationForm** — Multi-step form (3 steps, progress bar at top). Step 1: event name, event type (wedding/corporate/festival/private/club/other), city, venue, date picker, start time, duration. Step 2: guest count, budget min/max (TND), music style tags. Step 3: special requirements (textarea), review + submit. Show a summary card on Step 3.
>
> 5. **BrowseArtistsPage** — Full-width grid layout. Left sidebar filters: genre (checkboxes), city (dropdown), price range (slider), availability date picker. Artist cards in a responsive 3-column grid. Each card: photo, name, genre chips, price range, star rating, "View Profile" and "Send Request" buttons.
>
> 6. **BookingRequestFlow** — Three states in one component (controlled by a `step` prop):
>    - Step 1: Request form — event summary (read-only), optional message to artist, "Send Request" button.
>    - Step 2: Quote received — quote card showing price, duration, inclusions, conditions, expiry countdown timer, "Accept", "Counter", "Decline" buttons.
>    - Step 3: Quote comparison — side-by-side cards of up to 5 quotes with an "Accept" button on each.
>
> 7. **ContractPreviewPage** — Full-page PDF-style contract preview. Show contract fields: event details, artist/organizer names, agreed price, cancellation terms. At the bottom: signature canvas (draw signature with mouse/touch) + "Sign Contract" button. Show status badge: "Pending Your Signature" / "Awaiting Artist" / "Fully Signed".
>
> 8. **AdminPanel** — Dashboard layout with sidebar nav. Pages: Users (table with role, status, verify/suspend buttons), Bookings (table with status filter), Payments (table with "Mark as Paid" and "Release to Artist" buttons per row), Basic analytics (4 stat cards: total users, active bookings, total revenue TND, pending payouts).
>
> **General rules:**
> - Mobile-first responsive design
> - Use `#b7d507` for all primary buttons and active states
> - Use `#F9F9F9` as page background
> - Card backgrounds: white (`#FFFFFF`) with subtle shadow
> - Form inputs: white background, `#808080` placeholder text, `#b7d507` focus ring
> - All components must be self-contained and importable into a Next.js 14 App Router project

---

## A2. Folder Structure for Your Manual Work

After Stitch generates the components, place files as follows:

```
lime-event/
├── apps/
│   ├── web/                          ← Next.js frontend
│   │   ├── public/
│   │   │   └── logo.svg              ← PUT YOUR LOGO FILE HERE (name it exactly logo.svg)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/               ← shadcn/ui auto-generated components (do not edit)
│   │   │   │   └── lime/             ← PUT STITCH-GENERATED COMPONENTS HERE
│   │   │   │       ├── AuthPages.tsx
│   │   │   │       ├── ArtistProfilePage.tsx
│   │   │   │       ├── ArtistProfileEditForm.tsx
│   │   │   │       ├── EventCreationForm.tsx
│   │   │   │       ├── BrowseArtistsPage.tsx
│   │   │   │       ├── BookingRequestFlow.tsx
│   │   │   │       ├── ContractPreviewPage.tsx
│   │   │   │       └── AdminPanel.tsx
│   │   │   ├── styles/
│   │   │   │   └── globals.css       ← Tailwind base + custom CSS vars (see B2.1)
│   │   │   └── lib/
│   │   │       └── colors.ts         ← PUT YOUR COLOR CONSTANTS HERE (see below)
│   └── api/                          ← NestJS backend
├── packages/
│   └── shared/                       ← Shared TypeScript types (DTOs, enums)
└── .env                              ← Environment variables (never commit this)
```

**Color constants file** — create `apps/web/src/lib/colors.ts` with:

```ts
export const COLORS = {
  primary:    '#b7d507',
  text:       '#2E2E2E',
  accent:     '#808080',
  background: '#F9F9F9',
  white:      '#FFFFFF',
} as const;
```

**Logo** — place your logo at `apps/web/public/logo.svg`. Reference it in code as:
```tsx
<img src="/logo.svg" alt="lime" className="h-8 w-auto" />
```

---

# PART B — FOR THE CURSOR AGENTS

> **READ THIS FIRST.** Work through sections B1, B2, B3 in order. Do not start B2 until B1 tests pass. Do not start B3 until B2 is complete and you have listed all pages as working. At the end of B3 you STOP and notify the human. You do not deploy to production on your own.

---

## B1. Backend — NestJS + Supabase (DB) + Clerk (Auth)

### B1.1 — Monorepo + Project Setup

```bash
# From the project root
mkdir -p apps/api apps/web packages/shared
cd apps/api

# Initialize NestJS
npx @nestjs/cli new . --package-manager npm --skip-git

# Install all backend dependencies
npm install \
  @clerk/backend \
  @nestjs/config \
  @nestjs/jwt \
  @nestjs/passport \
  passport \
  passport-jwt \
  class-validator \
  class-transformer \
  prisma \
  @prisma/client \
  puppeteer \
  resend \
  uuid

npm install --save-dev \
  jest \
  @nestjs/testing \
  supertest \
  @types/supertest \
  ts-jest
```

Create root `.env` (never commit this file):

```env
# Clerk (https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database (Supabase Postgres — database only, not Supabase Auth)
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres

# Email
RESEND_API_KEY=re_your_key

# App
PORT=3001
NODE_ENV=development
```

---

### B1.2 — Clerk + Supabase Setup

**Clerk (auth) — human does this once:**

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → **Create application** → name: `lime-event`
2. Enable sign-in methods: **Email**, **Google** (and LinkedIn optional for MVP)
3. Copy into `.env`:
   - **API Keys** → Publishable key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **API Keys** → Secret key → `CLERK_SECRET_KEY`
4. **Webhooks** → Add endpoint `https://your-api.railway.app/auth/webhook` (or `http://localhost:3001/auth/webhook` via ngrok for local dev)
   - Subscribe to: `user.created`, `user.updated`
   - Copy **Signing secret** → `CLERK_WEBHOOK_SECRET`
5. **User metadata for roles:** On signup, store role in `publicMetadata.role` (`artist` | `organizer` | `agency`) via onboarding UI or webhook handler.
6. **Google OAuth:** Configure in Clerk → **SSO connections** → Google (Client ID/Secret go in **Clerk**, not in `.env`).

**Supabase (database only):**

1. Go to [supabase.com](https://supabase.com) → New Project → name it `lime-event`
2. **Do not** use Supabase Authentication for login — only Postgres.
3. Copy **Settings → Database → Connection string** → `DATABASE_URL` in `.env`

---

### B1.3 — Prisma Setup

```bash
cd apps/api
npx prisma init
```

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  artist
  organizer
  agency
  admin
}

enum EventType {
  wedding
  corporate
  festival
  private
  club
  other
}

enum BookingStatus {
  pending
  quoted
  negotiating
  accepted
  contracted
  completed
  declined
  cancelled
  expired
}

enum ContractStatus {
  draft
  pending_organizer
  pending_artist
  signed
  disputed
  void
}

enum PaymentStatus {
  pending
  held
  released
  refunded
  disputed
}

model User {
  id               String   @id @default(uuid())
  email            String   @unique
  role             Role
  clerk_user_id    String   @unique
  is_verified      Boolean  @default(false)
  is_active        Boolean  @default(true)
  created_at       DateTime @default(now())

  artist_profile   ArtistProfile?
  events           Event[]
  booking_requests_as_organizer BookingRequest[] @relation("organizer")
  booking_requests_as_artist    BookingRequest[] @relation("artist")
  notifications    Notification[]
}

model ArtistProfile {
  id             String   @id @default(uuid())
  user_id        String   @unique
  user           User     @relation(fields: [user_id], references: [id])
  display_name   String
  bio            String?
  genres         String[]
  city           String?
  pricing_min    Int?
  pricing_max    Int?
  portfolio_links Json?
  avg_rating     Float    @default(0)
  total_bookings Int      @default(0)
  agency_id      String?
}

model Event {
  id             String    @id @default(uuid())
  organizer_id   String
  organizer      User      @relation(fields: [organizer_id], references: [id])
  title          String
  event_type     EventType
  city           String?
  venue          String?
  event_date     DateTime
  start_time     String?
  duration_hours Float?
  guest_count    Int?
  budget_min     Int?
  budget_max     Int?
  style_tags     String[]
  status         String    @default("draft")
  created_at     DateTime  @default(now())

  booking_requests BookingRequest[]
}

model BookingRequest {
  id               String        @id @default(uuid())
  event_id         String
  event            Event         @relation(fields: [event_id], references: [id])
  artist_id        String
  artist           User          @relation("artist", fields: [artist_id], references: [id])
  organizer_id     String
  organizer        User          @relation("organizer", fields: [organizer_id], references: [id])
  status           BookingStatus @default(pending)
  message          String?
  quote_amount     Int?
  quote_conditions Json?
  quote_expires_at DateTime?
  created_at       DateTime      @default(now())

  contract         Contract?
  payment          Payment?
  messages         Message[]
}

model Contract {
  id                   String         @id @default(uuid())
  booking_request_id   String         @unique
  booking_request      BookingRequest @relation(fields: [booking_request_id], references: [id])
  pdf_url              String?
  organizer_signed_at  DateTime?
  artist_signed_at     DateTime?
  organizer_signature  String?
  artist_signature     String?
  status               ContractStatus @default(draft)
  template_type        String?
}

model Payment {
  id                   String         @id @default(uuid())
  booking_request_id   String         @unique
  booking_request      BookingRequest @relation(fields: [booking_request_id], references: [id])
  gross_amount         Int
  commission_amount    Int
  net_amount           Int
  status               PaymentStatus  @default(pending)
  payment_method       String?
  payment_intent_id    String?
  held_at              DateTime?
  released_at          DateTime?
}

model Notification {
  id         String   @id @default(uuid())
  user_id    String
  user       User     @relation(fields: [user_id], references: [id])
  type       String
  title      String
  body       String
  is_read    Boolean  @default(false)
  created_at DateTime @default(now())
}

model Message {
  id                 String         @id @default(uuid())
  booking_request_id String
  booking_request    BookingRequest @relation(fields: [booking_request_id], references: [id])
  sender_id          String
  content            String
  created_at         DateTime       @default(now())
}
```

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

### B1.4 — Row Level Security (optional with Clerk)

With **Clerk** auth, the browser does **not** talk to Supabase directly. All data access goes through the **NestJS API** (Prisma + `DATABASE_URL`). You do **not** need Supabase `auth.uid()` policies for MVP.

**Recommended for Phase 1:** Skip RLS, or enable RLS with **no public policies** so only the backend connection can read/write.

If you later expose Supabase Realtime from the client, add policies keyed on a custom JWT claim — out of scope for Phase 1.

Optional hardening (Supabase SQL editor):

```sql
-- Deny anonymous access; API uses direct Postgres connection
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- No policies = no access via Supabase Data API for anon/authenticated roles
```

---

### B1.5 — Clerk JWT Guard (NestJS)

```bash
cd apps/api
npm install @clerk/backend svix
```

Create `src/auth/clerk-auth.guard.ts`:

```ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'] as string | undefined;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
      req.clerkUserId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
```

Create `src/auth/roles.guard.ts`:

```ts
import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const req = context.switchToHttp().getRequest();
    const clerkUserId = req.clerkUserId as string;

    const user = await this.prisma.user.findUnique({
      where: { clerk_user_id: clerkUserId },
    });
    if (!user || !user.is_active || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException();
    }

    req.dbUser = user;
    return true;
  }
}
```

Create `src/auth/clerk-webhook.controller.ts` — sync Clerk users into Postgres on `user.created`:

```ts
import { Controller, Post, Req, Headers, BadRequestException } from '@nestjs/common';
import { Webhook } from 'svix';
import { AuthService } from './auth.service';

@Controller('auth')
export class ClerkWebhookController {
  constructor(private authService: AuthService) {}

  @Post('webhook')
  async handleWebhook(
    @Req() req: { rawBody: Buffer },
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
    const payload = wh.verify(req.rawBody.toString(), {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as { type: string; data: { id: string; email_addresses: { email_address: string }[]; public_metadata?: { role?: string } } };

    if (payload.type === 'user.created') {
      const email = payload.data.email_addresses[0]?.email_address;
      const role = payload.data.public_metadata?.role ?? 'organizer';
      await this.authService.syncUser({
        email,
        role,
        clerk_user_id: payload.data.id,
      });
    }
    return { received: true };
  }
}
```

> Enable `rawBody` for the webhook route in `main.ts` so Svix signature verification works.

Create `src/auth/roles.decorator.ts`:

```ts
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

---

### B1.6 — Prisma Service

Create `src/prisma/prisma.service.ts`:

```ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

---

### B1.7 — API Endpoints (Controllers + Services)

Create one NestJS module per domain. Folder structure:

```
src/
├── auth/
│   ├── clerk-auth.guard.ts
│   ├── clerk-webhook.controller.ts
│   └── roles.guard.ts
├── prisma/
│   └── prisma.service.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   └── users.service.ts
├── artists/
│   ├── artists.module.ts
│   ├── artists.controller.ts
│   ├── artists.service.ts
│   └── dto/update-artist.dto.ts
├── events/
│   ├── events.module.ts
│   ├── events.controller.ts
│   ├── events.service.ts
│   └── dto/create-event.dto.ts
├── bookings/
│   ├── bookings.module.ts
│   ├── bookings.controller.ts
│   ├── bookings.service.ts
│   └── dto/
├── contracts/
│   ├── contracts.module.ts
│   ├── contracts.controller.ts
│   ├── contracts.service.ts
│   └── templates/          ← HTML templates for PDF generation
│       ├── wedding.html
│       ├── corporate.html
│       └── private.html
├── payments/
│   ├── payments.module.ts
│   ├── payments.controller.ts
│   └── payments.service.ts
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.controller.ts
│   └── notifications.service.ts
├── ratings/
│   ├── ratings.module.ts
│   ├── ratings.controller.ts
│   └── ratings.service.ts
├── admin/
│   ├── admin.module.ts
│   ├── admin.controller.ts
│   └── admin.service.ts
└── app.module.ts
```

**Full endpoint list with access level:**

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | /auth/sync | Public | Manual sync fallback (Clerk user id + email + role) |
| POST | /auth/webhook | Clerk only | Svix webhook: `user.created` → create DB user |
| GET | /artists | Public | Browse artists with filters |
| GET | /artists/:id | Public | Get full artist profile |
| PATCH | /artists/:id | Artist (owner) | Update artist profile |
| POST | /events | Organizer | Create new event |
| GET | /events/:id | Auth | Get event details |
| GET | /events/:id/matches | Organizer | Get filter-matched artists |
| POST | /booking-requests | Organizer | Send booking request |
| GET | /booking-requests/:id | Auth (participant) | View booking request |
| PATCH | /booking-requests/:id/status | Auth (participant) | Update status (accept/decline) |
| POST | /booking-requests/:id/quote | Artist | Send quote |
| POST | /booking-requests/:id/accept | Organizer | Accept quote |
| GET | /booking-requests/:id/messages | Auth (participant) | Get chat messages |
| POST | /booking-requests/:id/messages | Auth (participant) | Send chat message |
| POST | /contracts/:id/sign | Auth (participant) | Sign contract |
| GET | /contracts/:id/pdf | Auth (participant) | Download contract PDF |
| GET | /calendar/:userId | Auth (owner) | Get user calendar events |
| POST | /payments | Organizer | Record payment intent |
| POST | /payments/:id/release | Admin | Release payment to artist |
| POST | /ratings | Auth | Submit post-event rating |
| GET | /notifications | Auth | Get user notifications |
| PATCH | /notifications/:id/read | Auth | Mark notification as read |
| GET | /admin/users | Admin | List all users |
| PATCH | /admin/users/:id | Admin | Suspend/verify user |
| GET | /admin/bookings | Admin | List all bookings |
| GET | /admin/payments | Admin | List all payments |
| PATCH | /admin/payments/:id/paid | Admin | Mark payment as received |

---

### B1.8 — Matching Endpoint (Basic Filters — NO AI)

Implement `GET /events/:id/matches` in `events.service.ts`:

```ts
async getMatches(eventId: string) {
  const event = await this.prisma.event.findUniqueOrThrow({
    where: { id: eventId },
  });

  const artists = await this.prisma.artistProfile.findMany({
    where: {
      // Filter 1: city match (case-insensitive)
      ...(event.city && {
        city: { equals: event.city, mode: 'insensitive' },
      }),
      // Filter 2: at least one genre tag matches event style_tags
      ...(event.style_tags?.length && {
        genres: { hasSome: event.style_tags },
      }),
      // Filter 3: price range overlap
      ...(event.budget_min !== null && {
        pricing_max: { gte: event.budget_min },
      }),
      ...(event.budget_max !== null && {
        pricing_min: { lte: event.budget_max },
      }),
    },
    include: { user: true },
  });

  // Filter 4: availability — exclude artists already booked on event_date
  const bookedArtistIds = await this.getBookedArtistIds(event.event_date);
  const available = artists.filter(a => !bookedArtistIds.has(a.user_id));

  // Phase 1: random sort (no AI ranking)
  // Phase 2: replace this with NLP/semantic scoring once 50+ artists exist
  return available.sort(() => Math.random() - 0.5);
}

private async getBookedArtistIds(date: Date): Promise<Set<string>> {
  const booked = await this.prisma.bookingRequest.findMany({
    where: {
      status: { in: ['accepted', 'contracted', 'completed'] },
      event: {
        event_date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
    },
    select: { artist_id: true },
  });
  return new Set(booked.map(b => b.artist_id));
}
```

---

### B1.9 — Contract PDF Generation (Puppeteer)

Create `src/contracts/pdf.service.ts`:

```ts
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

export class PdfService {
  async generateContract(data: {
    templateType: string;
    eventTitle: string;
    eventDate: string;
    artistName: string;
    organizerName: string;
    agreedPrice: number;
    artistSignatureUrl?: string;
    organizerSignatureUrl?: string;
  }): Promise<Buffer> {
    const templatePath = path.join(
      __dirname, 'templates', `${data.templateType}.html`
    );
    let html = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders
    Object.entries(data).forEach(([key, value]) => {
      html = html.replaceAll(`{{${key}}}`, String(value ?? ''));
    });

    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return Buffer.from(pdf);
  }
}
```

Create `src/contracts/templates/wedding.html` (and similar for corporate, private):

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #2E2E2E; }
    h1 { color: #b7d507; border-bottom: 2px solid #b7d507; padding-bottom: 8px; }
    .field { margin: 16px 0; }
    .label { font-weight: bold; }
    .signature { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 16px; }
    .sig-box img { max-height: 60px; }
  </style>
</head>
<body>
  <h1>LIME Event — Wedding Performance Contract</h1>
  <div class="field"><span class="label">Event:</span> {{eventTitle}}</div>
  <div class="field"><span class="label">Date:</span> {{eventDate}}</div>
  <div class="field"><span class="label">Artist:</span> {{artistName}}</div>
  <div class="field"><span class="label">Organizer:</span> {{organizerName}}</div>
  <div class="field"><span class="label">Agreed Fee:</span> {{agreedPrice}} TND</div>
  <div class="field">
    <span class="label">Terms:</span>
    Full fee payable via LIME platform. 50% cancellation fee applies if cancelled within 7 days.
    Artist obligations: arrive 30 minutes before start time, perform agreed set duration.
  </div>
  <div class="signature">
    <div class="sig-box">
      <div class="label">Organizer Signature:</div>
      {{#if organizerSignatureUrl}}<img src="{{organizerSignatureUrl}}" />{{/if}}
    </div>
    <div class="sig-box" style="margin-top:24px">
      <div class="label">Artist Signature:</div>
      {{#if artistSignatureUrl}}<img src="{{artistSignatureUrl}}" />{{/if}}
    </div>
  </div>
</body>
</html>
```

---

### B1.10 — Payment Intent + Commission

Commission calculation in `payments.service.ts`:

```ts
async createPaymentIntent(bookingRequestId: string, grossAmount: number, method: string) {
  const COMMISSION_RATE = 0.125; // 12.5% — adjust per booking if needed
  const commissionAmount = Math.round(grossAmount * COMMISSION_RATE);
  const netAmount = grossAmount - commissionAmount;

  return this.prisma.payment.create({
    data: {
      booking_request_id: bookingRequestId,
      gross_amount: grossAmount,
      commission_amount: commissionAmount,
      net_amount: netAmount,
      status: 'pending',
      payment_method: method,
    },
  });
}

async markAsPaid(paymentId: string) {
  return this.prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'held', held_at: new Date() },
  });
}

async releaseToArtist(paymentId: string) {
  return this.prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'released', released_at: new Date() },
  });
}
```

---

### B1.11 — Notification System

**In-app notifications** are stored in the `Notification` table and polled by the frontend.

**Email notifications** via Resend. Create `src/notifications/email.service.ts`:

```ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  async sendBookingRequestEmail(to: string, artistName: string, eventTitle: string) {
    await resend.emails.send({
      from: 'LIME Event <noreply@lime-event.tn>',
      to,
      subject: `New Booking Request — ${eventTitle}`,
      html: `<p>Hi ${artistName}, you have a new booking request for <strong>${eventTitle}</strong>. Log in to LIME to review it.</p>`,
    });
  }

  async sendQuoteReceivedEmail(to: string, organizerName: string, artistName: string) {
    await resend.emails.send({
      from: 'LIME Event <noreply@lime-event.tn>',
      to,
      subject: `Quote received from ${artistName}`,
      html: `<p>Hi ${organizerName}, ${artistName} has sent you a quote. Log in to LIME to review it.</p>`,
    });
  }

  async sendContractSignedEmail(to: string, name: string, eventTitle: string) {
    await resend.emails.send({
      from: 'LIME Event <noreply@lime-event.tn>',
      to,
      subject: `Contract signed — ${eventTitle}`,
      html: `<p>Hi ${name}, the contract for <strong>${eventTitle}</strong> has been fully signed. Check your dashboard for the PDF.</p>`,
    });
  }
}
```

---

### B1.12 — Tests (MANDATORY — All Must Pass Before Deployment)

**Jest config** in `apps/api/package.json`:

```json
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "testEnvironment": "node"
}
```

**Example unit test** — `src/payments/payments.service.spec.ts`:

```ts
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(() => {
    // Use a mocked PrismaService
    const mockPrisma = {
      payment: {
        create: jest.fn().mockResolvedValue({ id: 'pay-1', status: 'pending' }),
        update: jest.fn().mockResolvedValue({ id: 'pay-1', status: 'held' }),
      },
    };
    service = new PaymentsService(mockPrisma as any);
  });

  it('calculates 12.5% commission correctly', async () => {
    const result = await service.createPaymentIntent('req-1', 400, 'bank_transfer');
    // 400 * 0.125 = 50 commission, 350 net
    expect(result.commission_amount).toBe(50);
    expect(result.net_amount).toBe(350);
  });
});
```

**Example integration test** — `src/bookings/bookings.controller.spec.ts`:

```ts
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { INestApplication } from '@nestjs/common';

describe('BookingsController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  it('GET /booking-requests/:id requires auth', async () => {
    await request(app.getHttpServer())
      .get('/booking-requests/fake-id')
      .expect(401);
  });

  afterAll(() => app.close());
});
```

**Run all backend tests:**

```bash
cd apps/api
npm run test          # unit tests
npm run test:e2e      # integration tests
```

Agents must report: ✅ X tests passed, 0 failed — before moving to B2.

---

## B2. Frontend — Next.js + Stitch Components

### B2.1 — Project Setup

```bash
cd apps/web

# Initialize Next.js 14
npx create-next-app@14 . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --skip-git

# shadcn/ui
npx shadcn-ui@latest init
# When prompted: style=Default, base color=Neutral, CSS variables=Yes

# Install common shadcn components
npx shadcn-ui@latest add button input card dialog badge avatar tabs select textarea calendar

# Clerk (Next.js App Router)
npm install @clerk/nextjs

# HTTP client
npm install axios
```

**Configure LIME colors** in `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lime: {
          DEFAULT: '#b7d507',
          dark:    '#8fa004',
          light:   '#e8f59a',
        },
        brand: {
          text:       '#2E2E2E',
          accent:     '#808080',
          background: '#F9F9F9',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

Add to `src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary:    #b7d507;
  --color-text:       #2E2E2E;
  --color-accent:     #808080;
  --color-background: #F9F9F9;
}

body {
  background-color: var(--color-background);
  color: var(--color-text);
}
```

---

### B2.2 — Clerk (Next.js App Router)

Wrap the app in `src/app/layout.tsx`:

```tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

Create `src/middleware.ts`:

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/artists(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

Use Clerk UI on auth routes (recommended over custom forms for MVP):

- `app/sign-in/[[...sign-in]]/page.tsx` → `<SignIn />`
- `app/sign-up/[[...sign-up]]/page.tsx` → `<SignUp />` with `unsafeMetadata` or post-signup onboarding for **role** selection

**Role onboarding:** After first sign-up, redirect to `/onboarding/role` to pick Artist / Organizer / Agency, then:

1. `user.update({ publicMetadata: { role } })` via Clerk client
2. `POST /auth/sync` to NestJS with `{ email, role, clerk_user_id }`

Stitch `AuthPages` can be replaced by Clerk components or kept as a branded wrapper around `<SignIn />` / `<SignUp />`.

---

### B2.3 — API Client

Create `src/lib/api.ts`:

```ts
'use client';

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
});

/** Call from client components after Clerk is loaded */
export function attachClerkToken(getToken: () => Promise<string | null>) {
  api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

export default api;
```

In client pages, use `const { getToken } = useAuth()` from `@clerk/nextjs` and call `attachClerkToken(getToken)` once in a provider or per page.

---

### B2.4 — Pages to Build

Create the following Next.js App Router pages. Import the Stitch-generated components from `@/components/lime/` and wire them to the API client.

| Route | File | Component to import | API calls |
|---|---|---|---|
| `/` | `app/page.tsx` | Landing hero (build inline — simple) | none |
| `/sign-up` | `app/sign-up/[[...sign-up]]/page.tsx` | Clerk `<SignUp />` or `AuthPages` | Clerk + `/onboarding/role` + `POST /auth/sync` |
| `/sign-in` | `app/sign-in/[[...sign-in]]/page.tsx` | Clerk `<SignIn />` or `AuthPages` | Clerk session |
| `/artists` | `app/artists/page.tsx` | `BrowseArtistsPage` | `GET /artists?genre=&city=&priceMin=&priceMax=&date=` |
| `/artists/[id]` | `app/artists/[id]/page.tsx` | `ArtistProfilePage` | `GET /artists/:id` |
| `/artists/[id]/edit` | `app/artists/[id]/edit/page.tsx` | `ArtistProfileEditForm` | `PATCH /artists/:id` |
| `/events/new` | `app/events/new/page.tsx` | `EventCreationForm` | `POST /events` |
| `/events/[id]/matches` | `app/events/[id]/matches/page.tsx` | `BrowseArtistsPage` (filtered) | `GET /events/:id/matches` |
| `/bookings/[id]` | `app/bookings/[id]/page.tsx` | `BookingRequestFlow` | `GET /booking-requests/:id`, `POST /booking-requests/:id/quote`, `POST /booking-requests/:id/accept` |
| `/contracts/[id]` | `app/contracts/[id]/page.tsx` | `ContractPreviewPage` | `GET /contracts/:id`, `POST /contracts/:id/sign` |
| `/calendar` | `app/calendar/page.tsx` | Calendar (shadcn Calendar component) | `GET /calendar/:userId` |
| `/admin` | `app/admin/page.tsx` | `AdminPanel` | All `/admin/*` endpoints |

**Example page** — `app/artists/page.tsx`:

```tsx
'use client';
import { useState, useEffect } from 'react';
import BrowseArtistsPage from '@/components/lime/BrowseArtistsPage';
import api from '@/lib/api';

export default function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [filters, setFilters] = useState({ genre: '', city: '', priceMin: 0, priceMax: 5000 });

  useEffect(() => {
    api.get('/artists', { params: filters })
      .then(res => setArtists(res.data))
      .catch(console.error);
  }, [filters]);

  return <BrowseArtistsPage artists={artists} filters={filters} onFilterChange={setFilters} />;
}
```

---

### B2.5 — Playwright End-to-End Tests

```bash
cd apps/web
npm install --save-dev @playwright/test
npx playwright install chromium
```

Create `e2e/full-booking-flow.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test('Full booking flow — organizer books artist', async ({ page, browser }) => {

  // 1. Register organizer
  await page.goto(`${BASE}/sign-up`);
  await page.getByLabel('Email').fill('organizer@test.com');
  await page.getByLabel('Password').fill('TestPass123!');
  await page.getByRole('button', { name: 'Organizer' }).click();
  await page.getByRole('button', { name: 'Sign Up' }).click();
  await expect(page).toHaveURL(/dashboard/);

  // 2. Create event
  await page.goto(`${BASE}/events/new`);
  await page.getByLabel('Event name').fill('Test Wedding');
  await page.getByLabel('City').fill('Tunis');
  // ... fill remaining fields
  await page.getByRole('button', { name: 'Create Event' }).click();
  await expect(page).toHaveURL(/events\/.*\/matches/);

  // 3. Browse matched artists and send request
  const firstArtist = page.locator('[data-testid="artist-card"]').first();
  await firstArtist.getByRole('button', { name: 'Send Request' }).click();
  await page.getByRole('button', { name: 'Send Booking Request' }).click();
  await expect(page.getByText('Request sent')).toBeVisible();

  // 4. Switch to artist context and send quote
  const artistContext = await browser.newContext();
  const artistPage = await artistContext.newPage();
  await artistPage.goto(`${BASE}/sign-in`);
  // ... login as artist, navigate to booking, send quote
  await artistPage.getByRole('button', { name: 'Send Quote' }).click();

  // 5. Organizer accepts quote
  await page.reload();
  await page.getByRole('button', { name: 'Accept' }).click();

  // 6. Both parties sign contract
  await page.goto(`${BASE}/contracts/latest`);
  await page.getByTestId('signature-canvas').evaluate(canvas => {
    // Simulate drawing signature
    const ctx = (canvas as HTMLCanvasElement).getContext('2d')!;
    ctx.beginPath(); ctx.moveTo(10,10); ctx.lineTo(100,50); ctx.stroke();
  });
  await page.getByRole('button', { name: 'Sign Contract' }).click();
  await expect(page.getByText('Awaiting Artist')).toBeVisible();

  // 7. Verify calendar auto-block
  await page.goto(`${BASE}/calendar`);
  await expect(page.getByTestId('booked-date')).toBeVisible();
});
```

Run tests:

```bash
npx playwright test
```

Agents must report: ✅ Playwright tests passed — before moving to B3.

---

## B3. Deployment (Agents Stop Here — Human Approval Required)

### B3.1 — Deploy Backend to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# From apps/api
railway init
railway up

# Set environment variables in Railway dashboard or via CLI:
railway variables set CLERK_SECRET_KEY=...
railway variables set CLERK_WEBHOOK_SECRET=...
railway variables set DATABASE_URL=...
railway variables set RESEND_API_KEY=...
railway variables set NODE_ENV=production

# Run migrations against production DB
railway run npx prisma migrate deploy

# Verify health check
curl https://your-app.railway.app/health
# Expected: { "status": "ok" }
```

### B3.2 — Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel
vercel login

# From apps/web
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# CLERK_SECRET_KEY
# NEXT_PUBLIC_API_URL  (your Railway backend URL)
```

### B3.3 — STOP. Notify the Human.

After completing B3.1 and B3.2, agents must post the following message and wait. Do not touch the production environment.

```
========================================
STAGING DEPLOYMENT COMPLETE

Backend URL:  https://[your-app].railway.app
Frontend URL: https://[your-app].vercel.app

All tests passed:
  ✅ Jest unit tests:        X passed
  ✅ Supertest integration:  X passed
  ✅ Playwright E2E:         X passed

Awaiting your smoke test and approval before production deployment.

Please test:
  1. Sign up as organizer
  2. Create an event
  3. Browse artists and send a request
  4. Sign in as an artist and send a quote
  5. Accept the quote and sign the contract

Reply "APPROVED" to proceed with production deployment.
========================================
```

**Agents do nothing else until they receive "APPROVED".**

---

# PART C — AGENT CHECKLIST

Copy this into your Cursor task list. Check off each item only after it is fully working and tested.

```
BACKEND
[ ] NestJS project initialized (apps/api)
[ ] Prisma schema created and migrated
[ ] Clerk configured (email + Google SSO)
[ ] Clerk webhook (`user.created`) syncing users to Postgres
[ ] ClerkAuthGuard implemented and working
[ ] All API endpoints implemented (see B1.7 table)
[ ] Basic filter matching endpoint working (GET /events/:id/matches)
[ ] PDF contract generation working (Puppeteer, 3 templates)
[ ] Payment intent + commission logic working (12.5% default)
[ ] In-app notifications working (Notification table)
[ ] Email notifications working (Resend)
[ ] Jest unit tests written and passing
[ ] Supertest integration tests written and passing

FRONTEND
[ ] Next.js 14 project initialized (apps/web)
[ ] Tailwind configured with LIME colors (#b7d507, #2E2E2E, #808080, #F9F9F9)
[ ] shadcn/ui installed and configured
[ ] ClerkProvider + middleware configured (apps/web)
[ ] API client configured (Clerk session token on each request)
[ ] All pages built (see B2.4 table)
[ ] Stitch components imported from apps/web/src/components/lime/
[ ] Logo placed at apps/web/public/logo.svg
[ ] All pages connected to backend APIs
[ ] Loading, error, and success states handled on all pages

TESTING
[ ] Playwright E2E tests written (full booking flow)
[ ] Playwright tests passing

DEPLOYMENT
[ ] Backend deployed to Railway (staging)
[ ] Frontend deployed to Vercel (staging/preview)
[ ] All environment variables set
[ ] Health check endpoint responding
[ ] Human notified with staging URLs and test results
[ ] ⛔ WAITING FOR HUMAN APPROVAL BEFORE PRODUCTION DEPLOYMENT
```

---

*End of IMPLEMENTATION_PLAN_PHASE1.md*
