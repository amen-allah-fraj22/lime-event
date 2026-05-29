# LIME EVENT
## *Fresh booking, fresh talent.*

---

**Product Requirements Document (PRD)**
**AI-Powered Music & Event Talent Marketplace**
**Version 4.0 — MVP Engineering Edition**

| Field | Value |
|---|---|
| Project | LIME Event |
| Document Type | Cahier des Charges / PRD |
| Version | 4.0 — MVP Focused |
| Market | Tunisia (Primary), MENA (Phase 2) |
| Target Launch | MVP in 14–16 weeks |
| Document Language | English |

---

## 1. EXECUTIVE SUMMARY

LIME Event is an AI-powered music and event talent marketplace built to transform the fragmented, informal talent-booking industry in Tunisia and the wider MENA region. Inspired by workflow systems like Muzeek, LIME is not a simple listing platform — it is a full Event Operating System (Event OS) that automates discovery, matching, booking, contract generation, calendar coordination, and payment settlements.

> **Core Value Proposition**
> - **For Artists:** A professional, structured pipeline that brings bookings to them with zero manual chasing.
> - **For Organizers:** A one-stop shop to find, vet, book, contract, and pay talent — in minutes, not days.
> - **For Agencies:** A VIP management dashboard to orchestrate multiple artists across multiple events simultaneously.

### 1.1 The Problem We Solve

| Pain Point | Current Reality |
|---|---|
| No structured booking system | All bookings happen via WhatsApp and phone calls — no history, no accountability. |
| No contract standardization | Agreements are verbal or loosely written — leading to disputes and unpaid gigs. |
| No scheduling visibility | Artists get double-booked; organizers have no confirmation until the last minute. |
| No trust layer | No escrow, no payment guarantee, no rating system to vet new talent. |
| No discovery infrastructure | Finding the right artist for an event relies purely on word-of-mouth. |
| Manual negotiation waste | Hours spent back-and-forth on price, conditions, and terms. |

### 1.2 The LIME Solution — 5 Core Engines

| # | Engine | Description | Delivery |
|---|---|---|---|
| 1 | Marketplace Engine | Discovery, search, artist profiles | MVP |
| 2 | AI Matching Engine | Intelligent artist-event pairing | MVP (basic filters) |
| 3 | Booking Engine | Request → Quote → Accept workflow | MVP |
| 4 | Event Management Engine | Calendar, contracts, reminders | MVP + Phase 2 |
| 5 | Financial Engine | Escrow, settlement, payouts | Phase 2 (structured in MVP) |

---

## 2. USER PERSONAS & ROLES

### 2.1 Artists

> **Artist Persona — Yasmine, Solo Vocalist, 26**
> - **Goals:** Get more bookings, look professional, stop losing gigs to informal negotiations.
> - **Pain:** Clients lowball her, cancel last minute, pay late or not at all.
> - **Needs:** A portfolio page, a quote system, contract protection, calendar sync, fast payments.
> - **Tech comfort:** High — uses Instagram, WhatsApp, Spotify daily.

**Artist Capabilities on LIME**

| Feature | Details |
|---|---|
| Profile | Name, bio, music genres, portfolio (audio/video links), pricing range, location, languages |
| Availability | Real-time calendar showing blocked/available dates |
| Quote System | Respond to booking requests with structured price quotes and conditions |
| Contracts | Receive, review, and digitally sign event contracts |
| Payments | Receive settlements after event completion via escrow release |
| Reputation | Accumulate ratings, reviews, and a trust score visible to organizers |
| Notifications | Push/email alerts for new requests, contract updates, reminders |

### 2.2 Organizers

> **Organizer Persona — Karim, Corporate Event Planner, 34**
> - **Goals:** Find reliable talent fast, avoid last-minute disasters, have everything documented.
> - **Pain:** Can't find the right artist for a budget, no confirmation system, disputes about what was agreed.
> - **Needs:** AI recommendations, quote comparison, contract generation, payment tracking.
> - **Tech comfort:** Medium-high — uses Excel, email, basic apps.

**Organizer Capabilities on LIME**

| Feature | Details |
|---|---|
| Event Creation | Title, type, location, date/time, budget range, guest count, style preferences |
| AI Recommendations | Instantly receive filter-matched artist suggestions tailored to the event |
| Multi-Request | Send booking requests to multiple artists simultaneously |
| Quote Comparison | Review and compare artist quotes side by side |
| Contract Review | Receive auto-generated contract, review terms, sign digitally |
| Escrow Payment | Pay LIME platform; funds held until event completion |
| Post-Event Rating | Rate and review artist after the event |

### 2.3 Agencies (VIP Tier)

> **Agency Persona — SoundPro Agency, Manages 15+ Artists**
> - **Goals:** Manage all bookings, contracts, and payments for their roster in one place.
> - **Pain:** Impossible to track 15 artists across 30 events manually.
> - **Needs:** Master dashboard, calendar overview, bulk contract management, subscription billing.
> - **Tech comfort:** High — uses CRM tools, SaaS products.

**Agency Capabilities on LIME**

| Feature | Details |
|---|---|
| Roster Management | Add/remove artists from agency roster, manage profiles on their behalf |
| Unified Dashboard | Single view of all artist availability, bookings, and contract statuses |
| Event Oversight | Monitor all events their artists are involved in |
| Contract Approval | Review and approve contracts for represented artists |
| Aggregate Calendar | Master calendar view showing all artists' schedules and conflicts |
| Financial Tracking | Track incoming payments across entire roster |
| Subscription Access | Monthly/annual plan unlocking VIP features |

### 2.4 Platform Admin

| Admin Function | Details |
|---|---|
| User Management | Verify artists, organizers, and agencies; suspend/ban accounts |
| Commission Oversight | Monitor and adjust commission rates per booking |
| Dispute Resolution | Intervene in contested bookings, contracts, or payment disputes |
| Content Moderation | Review flagged profiles, portfolios, and reviews |
| Analytics Dashboard | Platform-wide KPIs: bookings, revenue, active users, funnel metrics |

---

## 3. COMPLETE USER JOURNEYS

### 3.1 Organizer Journey — Full Booking Flow

---
**STEP 1 — REGISTRATION & ONBOARDING**

| | |
|---|---|
| Action | Organizer visits LIME, clicks 'Sign Up as Organizer', authenticates via Clerk (email/Google/LinkedIn) |
| Input Required | Full name, email, phone, company name (optional), profile photo |
| System Response | Account created, onboarding checklist shown (3 steps: complete profile, post first event, invite artist) |
| Edge Cases | Duplicate email → prompt to login; invalid phone → inline error message |

---
**STEP 2 — EVENT CREATION**

| | |
|---|---|
| Action | Organizer clicks 'Create Event', fills in structured form |
| Fields | Event name, event type (wedding/corporate/festival/private/other), city, venue, date, time, duration, expected guests, budget min/max, music style(s), special requirements |
| AI Assist | As organizer types, system suggests missing fields and flags unrealistic budgets for the selected event type |
| Validation | Date cannot be in the past; budget field shows market range tooltip; required fields highlighted in real-time |
| Output | Event draft saved; filter-based matching triggered automatically in the background |

---
**STEP 3 — MATCHING & DISCOVERY**

| | |
|---|---|
| What Happens | Matching engine processes event parameters and returns a list of compatible artists |
| Matching Factors | Genre match, location (city), availability on event date, price range compatibility |
| Display | Artist cards shown with: name, genre tags, price range, rating, availability badge, 'Request' button |
| Filtering | Organizer can further filter by genre, price, rating, distance |
| Browse Mode | Organizer can also ignore matched results and search/browse entire marketplace |

---
**STEP 4 — SENDING BOOKING REQUESTS**

| | |
|---|---|
| Action | Organizer clicks 'Send Request' on one or multiple artist cards |
| Request Content | Event details auto-populated + optional message to artist |
| Multi-Request | Can send to up to 5 artists simultaneously for the same event |
| Artist Notification | Artist receives push notification + email: 'New booking request from [Organizer Name]' |
| Status Tracking | Request appears in organizer dashboard as 'Pending' |

---
**STEP 5 — QUOTE REVIEW & NEGOTIATION**

| | |
|---|---|
| Artist Response | Artist sends a structured quote: fixed/variable price, duration, travel costs, equipment needs, special conditions |
| Organizer View | Quote displayed in structured card format; multiple quotes from different artists can be compared side by side |
| Counter-Offer | Organizer can accept, reject, or counter-offer via chat thread attached to each request |
| Chat System | In-platform messaging with message history preserved for the life of the booking |
| Expiry | Quotes automatically expire after 48 hours if no response (configurable) |

---
**STEP 6 — CONTRACT GENERATION**

| | |
|---|---|
| Trigger | Organizer clicks 'Accept Quote' — contract generation begins immediately |
| Auto-Population | System pulls: event details, artist details, agreed price, payment terms, cancellation policy, artist obligations, organizer obligations |
| Template | Legal template pre-configured per event type (wedding contract differs from corporate contract) |
| Review | Both parties receive PDF preview of contract before signing |
| Digital Signature | Organizer signs first via embedded e-signature widget; artist counter-signs; both receive signed PDF copy by email |
| Storage | Signed contract stored in LIME database, accessible in both dashboards permanently |

---
**STEP 7 — CALENDAR SYNCHRONIZATION**

| | |
|---|---|
| What Happens | Upon contract signing, event is locked in both the artist's and organizer's LIME calendar |
| Double-Booking Prevention | Artist's date is immediately marked unavailable; any pending requests for the same date from other organizers are auto-notified |
| Calendar View | Organizer sees all their booked events; artist sees full schedule |
| Reminders | Automated reminders sent: 7 days before, 48 hours before, morning of event |
| Export (Phase 2) | Google Calendar / iCal sync in Phase 2 |

---
**STEP 8 — PAYMENT (ESCROW STRUCTURE)**

| | |
|---|---|
| MVP Implementation | Payment intent recorded (amount, method, due date); actual processing requires payment gateway (Phase 2) |
| Escrow Logic (Phase 2) | Organizer pays full amount to LIME platform; funds held in escrow account |
| Release Trigger | Event completes → organizer marks 'Event Completed' OR auto-released 24h after event date |
| Dispute Window | 48-hour window for organizer to raise dispute before automatic release |
| Platform Fee | 10–15% commission automatically deducted before release to artist |
| Artist Payout | Net amount transferred to artist's linked bank/wallet within 3 business days |

---
**STEP 9 — POST-EVENT**

| | |
|---|---|
| Rating Request | Both organizer and artist receive 'Rate your experience' prompt 24h after event |
| Rating System | 5-star rating + optional written review; scores averaged into public profile |
| Organizer Score | Artists can rate organizers too — building a two-sided reputation system |
| Repeat Booking | One-click 'Rebook this artist' option on post-event screen |

### 3.2 Artist Journey — Full Flow

| Step | Description |
|---|---|
| Registration | Sign up via email/Google, select 'Artist' role, verify identity (Phase 2: ID verification) |
| Profile Setup | Name, bio, genres (multi-select), portfolio links (SoundCloud/YouTube/Spotify), pricing range, city, languages, profile photo |
| Profile Completeness | Progress bar shown; incomplete profiles receive fewer recommendations |
| Receive Request | Push notification + email when organizer sends booking request |
| Review Event | View full event brief: type, date, location, budget, guest count, organizer profile |
| Send Quote | Structured form: price (fixed/range), duration, what's included, travel surcharge, equipment needs, cancellation terms |
| Negotiate | Use in-platform chat to discuss terms; can update quote up to 3 times per request |
| Sign Contract | Receive contract draft, review terms, sign digitally via embedded widget |
| Perform Event | Calendar reminder on event day; in-app 'Check-in' option for attendance confirmation |
| Get Paid | Payment released within 3 days of event completion; tracked in artist financial dashboard |
| Rate Organizer | Rate the organizer after payment received |

### 3.3 Agency Journey — VIP Flow

| Step | Description |
|---|---|
| Registration | Sign up as Agency, submit company details, subscribe to Agency Plan |
| Roster Building | Invite artists via email; artists accept to join agency roster |
| Unified Dashboard | See all roster artists, their availability, active bookings, pending requests |
| Event Assignment | Receive event requests from organizers addressed to agency; assign to suitable artist |
| Contract Management | Review and approve contracts on behalf of artists |
| Master Calendar | Agency-level calendar showing all artist schedules overlaid |
| Financial Overview | Track all incoming payments across roster; download monthly statements |
| Subscription Management | Manage plan, billing, and add/remove agency seats |

---

## 4. FUNCTIONAL REQUIREMENTS

### 4.1 Authentication & User Management

| Req. ID | Requirement |
|---|---|
| AUTH-01 | Email/password registration with email verification |
| AUTH-02 | Social login: Google OAuth (mandatory for MVP) |
| AUTH-03 | Role selection at registration: Artist / Organizer / Agency |
| AUTH-04 | Session management via Clerk (JWT). Clerk handles token refresh and session lifecycle. |
| AUTH-05 | Password reset via email link |
| AUTH-06 | Profile completeness score displayed on dashboard |
| AUTH-07 | Account suspension by admin (flag + notify user) |

### 4.2 Artist Profile System

| Req. ID | Requirement |
|---|---|
| PROF-01 | Artist profile page: photo, name, bio, genres, languages, city |
| PROF-02 | Portfolio section: embed SoundCloud, YouTube, Spotify, or upload audio clips |
| PROF-03 | Pricing section: base rate (range), per-hour rate, minimum booking duration |
| PROF-04 | Availability calendar: artist marks available/unavailable dates manually |
| PROF-05 | Auto-block: system automatically marks booked dates as unavailable after contract signed |
| PROF-06 | Profile verification badge (admin-granted after ID check — Phase 2) |
| PROF-07 | Public profile URL shareable externally |
| PROF-08 | Rating display: average stars, total reviews, breakdown by category |

### 4.3 Marketplace & Discovery

| Req. ID | Requirement |
|---|---|
| DISC-01 | Browse all artists with paginated grid/list view |
| DISC-02 | Search by name, genre, city |
| DISC-03 | Filter: genre, price range, rating, availability date, city |
| DISC-04 | Artist cards: photo, name, genre tags, price range, rating, 'Request' CTA |
| DISC-05 | Featured/promoted listings (paid placement — Phase 2) |
| DISC-06 | Recently booked / trending artists section on homepage |

### 4.4 Matching Engine (Phase 1 — Basic Filters)

> **Phase 1 Matching Philosophy:** The MVP uses basic filters only. No OpenAI or external AI API is used in Phase 1 — this removes cost and complexity. The matching endpoint returns artists filtered by genre, city, price range, and availability, then randomly sorted within the result set. NLP / semantic matching will be added in Phase 2 once there are 50+ artists in the database.

| Req. ID | Requirement |
|---|---|
| AI-01 | On event creation, trigger filter-based matching automatically |
| AI-02 | Filter factors: genre match, city match, price range compatibility, availability on event date |
| AI-03 | Return matching artists (up to 10); no AI ranking in Phase 1 — results are randomly ordered within filter matches |
| AI-04 | Event Assistant: suggest missing event brief fields in real-time (rule-based, no external AI) |
| AI-05 | Conflict detection: if artist already booked on event date, exclude from results |
| AI-06 | Re-filter on filter change without reloading page |
| AI-07 (P2) | NLP / semantic matching engine: add after 50+ artists are in the database; improve recommendations based on historical booking outcomes |

### 4.5 Booking Engine

| Req. ID | Requirement |
|---|---|
| BOOK-01 | Organizer sends booking request to artist with event details |
| BOOK-02 | Artist receives notification and can accept (send quote) or decline |
| BOOK-03 | Artist sends structured quote: price, duration, inclusions, conditions |
| BOOK-04 | Organizer can accept, reject, or counter-offer |
| BOOK-05 | In-thread messaging per booking request, with full history |
| BOOK-06 | Quote expiry: 48-hour countdown with visual timer |
| BOOK-07 | Booking status lifecycle: Pending → Quoted → Negotiating → Accepted → Contracted → Completed / Cancelled |
| BOOK-08 | Cancel policy: terms defined in contract; cancellation fee logic triggered on cancellation |

### 4.6 Contract System

| Req. ID | Requirement |
|---|---|
| CONT-01 | Contract auto-generated upon quote acceptance |
| CONT-02 | Template library: Wedding, Corporate, Festival, Private Party, Club Night |
| CONT-03 | Auto-populated fields: all event details, agreed price, artist & organizer details |
| CONT-04 | Editable sections before signing: artist can request clause modifications |
| CONT-05 | Digital signature: embedded e-sign widget (DocuSign-style, Phase 1 = image-based signature) |
| CONT-06 | Signed PDF generated and sent to both parties by email |
| CONT-07 | Contract stored in platform; accessible from booking history |
| CONT-08 | Cancellation clauses: define fees for artist cancellation vs organizer cancellation |

### 4.7 Calendar System

| Req. ID | Requirement |
|---|---|
| CAL-01 | Artist personal calendar: view, add availability blocks, see booked dates |
| CAL-02 | Organizer event calendar: view all their past and upcoming events |
| CAL-03 | Agency master calendar: overlay all roster artist schedules |
| CAL-04 | Auto-block: contract signed → date locked for artist automatically |
| CAL-05 | Conflict alert: attempt to book already-booked artist triggers warning |
| CAL-06 | Event reminders: 7 days, 48 hours, same-day push + email notifications |
| CAL-07 (P2) | Google Calendar / Apple iCal two-way sync |

### 4.8 Payment & Financial Engine

| Req. ID | Requirement |
|---|---|
| PAY-01 | MVP: Payment intent recorded (amount, date, method) — no gateway processing yet |
| PAY-02 | MVP: Manual payment confirmation by admin; status tracked in system |
| PAY-03 | P2: Integrate Stripe or Flouci (Tunisian gateway) for live payment processing |
| PAY-04 | P2: Escrow logic — funds held by platform until event completion |
| PAY-05 | P2: Auto-release 24h after event date if no dispute raised |
| PAY-06 | P2: Dispute flow — organizer flags issue; admin reviews within 48h |
| PAY-07 | Commission deduction: 10–15% automatically calculated and deducted |
| PAY-08 | Artist financial dashboard: pending, completed, and total earnings |
| PAY-09 | Invoice generation: auto-generated PDF invoice per completed booking |
| PAY-10 | Agency payout: agency receives collective payment, distributes to artists |

### 4.9 Notification System

| Req. ID | Requirement |
|---|---|
| NOTIF-01 | In-app notifications: bell icon with unread count, notification feed |
| NOTIF-02 | Email notifications: booking requests, quote received, contract signed, payment released |
| NOTIF-03 | Push notifications (mobile web): event reminders, message received |
| NOTIF-04 | Notification preferences: users can toggle types on/off |
| NOTIF-05 | WhatsApp integration (Phase 2): send booking confirmation via WhatsApp API |

### 4.10 Rating & Review System

| Req. ID | Requirement |
|---|---|
| RATE-01 | Post-event prompt: both parties receive rating request 24h after event |
| RATE-02 | Rating categories for artist: Punctuality, Performance Quality, Professionalism, Communication |
| RATE-03 | Rating categories for organizer: Payment timeliness, Communication, Clear brief, Professionalism |
| RATE-04 | Optional written review (max 500 characters) |
| RATE-05 | Ratings visible on public profiles; average score prominently displayed |
| RATE-06 | Minimum 3 ratings before score is shown publicly |
| RATE-07 | Flagging: users can report abusive reviews; admin moderates |

---

## 5. TECHNICAL ARCHITECTURE

### 5.1 Tech Stack — Final Selection

| Layer | Technology + Rationale |
|---|---|
| Frontend (Web) | Next.js 14 (App Router) — React-based, SSR/SSG for SEO, fast performance. **Phase 1 is web-only.** Responsive design ensures full usability on mobile browsers without a native app. |
| Styling | Tailwind CSS + shadcn/ui component library |
| Mobile | **Phase 1:** Responsive web (Next.js) — works on all mobile browsers, no native app. **Phase 2:** Native Flutter app for iOS and Android. No Flutter work in Phase 1. |
| Backend | Node.js with NestJS framework — modular, scalable, TypeScript-first. **The NestJS backend serves both the web frontend and the future mobile app via the same API. Web and mobile share 100% of backend APIs.** |
| Database | Supabase (PostgreSQL) — hosted Postgres, optional RLS; **not** used for authentication |
| Authentication | **Clerk** — handles sign-up, login, JWT sessions, social auth (email/Google/LinkedIn), webhooks to sync users into LIME database |
| File Storage | Cloudinary — artist portfolio media, profile photos, contract PDFs |
| Email | Resend (transactional email API) or SendGrid |
| AI Engine | **Phase 1:** Basic filter logic only — no external AI API. **Phase 2:** OpenAI API (GPT-4o) for advanced matching and Event Assistant. OpenAI API is NOT in Phase 1. |
| Contract PDF | Puppeteer (Node.js headless browser) for PDF generation from HTML templates |
| Payments (P2) | Stripe (international) + Flouci or Konnect (Tunisia-specific gateway) |
| Hosting — Frontend | Vercel — zero-config Next.js deployment, edge network |
| Hosting — Backend | Railway — simple Node.js hosting, auto-scaling, PostgreSQL add-on available |
| Monitoring | Sentry (error tracking) + PostHog (product analytics) |
| Version Control | GitHub — monorepo (apps/web, apps/api, packages/shared) |

> **Logo & Brand Note:** The LIME logo is already designed — a half-lime with three seeds and wordmark "lime", with slogan "Fresh bookings, Fresh talent." Color palette: primary `#b7d507`, text `#2E2E2E`, accents `#808080`, background `#F9F9F9`.

### 5.2 Database Schema — Core Tables

**users**

| Column | Type |
|---|---|
| id | UUID PRIMARY KEY |
| email | VARCHAR UNIQUE NOT NULL |
| role | ENUM: artist \| organizer \| agency \| admin |
| clerk_user_id | VARCHAR UNIQUE (Clerk user ID) |
| created_at | TIMESTAMP WITH TIME ZONE |
| is_verified | BOOLEAN DEFAULT false |
| is_active | BOOLEAN DEFAULT true |

**artist_profiles**

| Column | Type |
|---|---|
| id | UUID PRIMARY KEY |
| user_id | FK → users.id |
| display_name | VARCHAR NOT NULL |
| bio | TEXT |
| genres | VARCHAR[] (array of genre tags) |
| city | VARCHAR |
| pricing_min | INTEGER (TND) |
| pricing_max | INTEGER (TND) |
| portfolio_links | JSONB (array of {type, url} objects) |
| avg_rating | DECIMAL(3,2) DEFAULT 0 |
| total_bookings | INTEGER DEFAULT 0 |
| agency_id | FK → agencies.id (nullable) |

**events**

| Column | Type |
|---|---|
| id | UUID PRIMARY KEY |
| organizer_id | FK → users.id |
| title | VARCHAR NOT NULL |
| event_type | ENUM: wedding \| corporate \| festival \| private \| club \| other |
| city | VARCHAR |
| venue | VARCHAR |
| event_date | DATE NOT NULL |
| start_time | TIME |
| duration_hours | DECIMAL |
| guest_count | INTEGER |
| budget_min | INTEGER |
| budget_max | INTEGER |
| style_tags | VARCHAR[] |
| status | ENUM: draft \| open \| contracted \| completed \| cancelled |
| created_at | TIMESTAMP WITH TIME ZONE |

**booking_requests**

| Column | Type |
|---|---|
| id | UUID PRIMARY KEY |
| event_id | FK → events.id |
| artist_id | FK → users.id |
| organizer_id | FK → users.id |
| status | ENUM: pending \| quoted \| negotiating \| accepted \| contracted \| completed \| declined \| cancelled \| expired |
| message | TEXT (initial message from organizer) |
| quote_amount | INTEGER (agreed price in TND) |
| quote_conditions | JSONB |
| quote_expires_at | TIMESTAMP |
| created_at | TIMESTAMP WITH TIME ZONE |

**contracts**

| Column | Type |
|---|---|
| id | UUID PRIMARY KEY |
| booking_request_id | FK → booking_requests.id |
| pdf_url | VARCHAR (Cloudinary URL) |
| organizer_signed_at | TIMESTAMP |
| artist_signed_at | TIMESTAMP |
| organizer_signature | VARCHAR (image URL or signature hash) |
| artist_signature | VARCHAR |
| status | ENUM: draft \| pending_organizer \| pending_artist \| signed \| disputed \| void |
| template_type | VARCHAR (maps to contract template used) |

**payments**

| Column | Type |
|---|---|
| id | UUID PRIMARY KEY |
| booking_request_id | FK → booking_requests.id |
| gross_amount | INTEGER (full amount paid by organizer) |
| commission_amount | INTEGER (platform fee) |
| net_amount | INTEGER (artist payout) |
| status | ENUM: pending \| held \| released \| refunded \| disputed |
| payment_method | VARCHAR (cash \| bank_transfer \| stripe \| flouci) |
| payment_intent_id | VARCHAR (gateway reference — nullable for MVP) |
| held_at | TIMESTAMP |
| released_at | TIMESTAMP |

### 5.3 API Structure — Key Endpoints

| Endpoint | Description | Access |
|---|---|---|
| POST /auth/register | Register new user with role selection | Public |
| GET /artists | Browse/search artists with filters | Public |
| GET /artists/:id | Get full artist profile | Public |
| POST /events | Create new event | Organizer |
| GET /events/:id/matches | Get filter-matched artists for event | Organizer |
| POST /booking-requests | Send booking request to artist | Organizer |
| GET /booking-requests/:id | View booking request details | Auth |
| POST /booking-requests/:id/quote | Artist sends quote | Artist |
| POST /booking-requests/:id/accept | Organizer accepts quote | Organizer |
| POST /contracts/:id/sign | Sign contract (organizer or artist) | Auth |
| GET /contracts/:id/pdf | Download contract PDF | Auth |
| GET /calendar/:userId | Get user's calendar events | Auth |
| POST /payments | Record payment intent | Organizer |
| POST /payments/:id/release | Mark payment as released | Admin |
| POST /ratings | Submit post-event rating | Auth |
| GET /admin/dashboard | Platform analytics | Admin |

---

## 6. MVP SCOPE & PHASING

### 6.1 MVP Must-Have Features (Phase 1)

> **MVP Philosophy**
> The MVP must be enough to complete one full booking cycle end-to-end. Every feature in MVP directly enables: Register → Create Event → Match → Request → Quote → Contract → Book. Payment in MVP = structured intent + manual confirmation. Live processing is Phase 2.

| MVP Feature | Scope |
|---|---|
| User Auth & Roles | Registration, login, role selection, Clerk integration + DB user sync |
| Artist Profiles | Full profile creation, portfolio links, pricing, city, bio |
| Availability Calendar | Artist marks available/unavailable dates; auto-block on booking |
| Event Creation | Full event brief form with all required fields |
| **Basic Filters (Genre, City, Price, Availability)** | Filter-based matching of artists per event; no OpenAI in Phase 1 |
| Marketplace Browse | Search, filter, artist card display, public profile pages |
| Booking Request Flow | Send request, artist receives, can accept or decline |
| Quote System | Artist sends structured quote; organizer can accept/counter |
| In-Thread Messaging | Simple chat per booking request |
| Contract Generation | PDF auto-generated from template; both parties sign |
| Calendar Sync | Date locked after contract signed; reminder notifications |
| Payment Intent | Record payment details; commission calculated; manual admin release |
| Post-Event Rating | 5-star rating + review for both parties |
| Notification System | In-app + email for all key events |
| Admin Panel | User management, booking oversight, manual payment release |

### 6.2 Phase 2 Features (Post-MVP)

| Phase 2 Feature | Description |
|---|---|
| Live Payment Processing | Stripe + Flouci integration; real escrow; auto-release |
| Agency Dashboard | Full VIP tier with roster, master calendar, bulk contracts |
| Google Calendar Sync | Two-way iCal/Google Calendar integration |
| WhatsApp Notifications | Booking confirmations and reminders via WhatsApp Business API |
| AI Assistant (Advanced) | Conversational event planning assistant powered by GPT-4o |
| ID Verification | Artist/organizer identity verification via document upload |
| Flutter Mobile App | iOS + Android native app (no Flutter in Phase 1) |
| Featured Listings | Paid promotional slots for artists |
| Analytics Dashboard | Advanced booking funnel, revenue, and retention analytics |
| AI / NLP Matching Engine | Semantic matching added after 50+ artists in database |

### 6.3 Payment Infrastructure — Prepared in MVP, Activated in Phase 2

> **MVP Payment Architecture Decision**
> - Build all payment data structures (payments table, commission logic, payout tracking) in MVP.
> - UI shows payment status and expected amounts — but actual money movement is admin-handled.
> - When Stripe/Flouci is integrated in Phase 2, plug into pre-existing data model — zero rework needed.
> - This ensures organizers and artists already understand the flow before live money is involved.

| Component | MVP Implementation |
|---|---|
| MVP Payment Status UI | Show: 'Payment Due', 'Payment Confirmed', 'Payout Pending', 'Payout Released' |
| Commission Calculation | Auto-calculate 10–15% commission on every booking; display to both parties |
| Payment Record | Store: amount, method (bank/cash/card), date, reference number |
| Admin Confirmation | Admin panel has 'Mark as Paid' and 'Release to Artist' buttons |
| Invoice PDF | Auto-generate invoice PDF after payment confirmed (Puppeteer) |
| Stripe Tables Created | payment_intents, payouts tables built but dormant in MVP |

---

## 7. MVP COST ESTIMATION

All estimates below assume a small, skilled team working in Tunisia. Rates used:

| Role | Rate |
|---|---|
| Senior Full-Stack Developer | $35–45 / hour (local Tunisian market rate for experienced dev) |
| Junior Developer | $15–20 / hour |
| UI/UX Designer | $25–35 / hour |
| Project Manager / Tech Lead | $40–50 / hour (part-time) |
| Working hours assumed | 8 hours/day, 5 days/week |
| Senior day rate | $280–360/day → using $300/day for estimates |
| Junior day rate | $120–160/day → using $140/day for estimates |
| Designer day rate | $200–280/day → using $240/day for estimates |

### 7.1 Development Cost Breakdown

| Module / Task | Days (Junior) | Days (Senior) | Cost Estimate (USD) |
|---|---|---|---|
| 1. Project Setup & Architecture | 2 | 3 | $1,140 |
| 2. Auth System (Clerk, roles, webhooks) | 2 | 2 | $880 |
| 3. Artist Profile System | 4 | 3 | $1,460 |
| 4. Organizer Profile + Event Creation | 3 | 2 | $1,020 |
| 5. Marketplace Browse + Search + Filter | 4 | 2 | $1,160 |
| 6. Basic Filter Matching Engine | 1 | 3 | $1,040 |
| 7. Booking Request Flow | 3 | 3 | $1,320 |
| 8. Quote System + Negotiation | 3 | 3 | $1,320 |
| 9. In-Thread Messaging (per booking) | 3 | 2 | $1,020 |
| 10. Contract PDF Generation | 2 | 4 | $1,480 |
| 11. Digital Signature Widget | 2 | 3 | $1,140 |
| 12. Calendar System (Artist + Organizer) | 3 | 4 | $1,620 |
| 13. Notification System (in-app + email) | 3 | 2 | $1,020 |
| 14. Payment Intent + Commission Logic | 2 | 3 | $1,140 |
| 15. Rating & Review System | 3 | 2 | $1,020 |
| 16. Admin Panel | 4 | 3 | $1,460 |
| 17. UI/UX Design (all screens) | — | 15d Designer | $3,600 |
| 18. QA, Testing, Bug Fixes | 5 | 3 | $1,600 |
| 19. Deployment Setup (Vercel + Railway) | 1 | 2 | $740 |
| 20. Documentation + Handoff | 1 | 1 | $440 |
| **TOTAL DEVELOPMENT** | **51 days** | **50 days + 15 design** | **~$25,620** |

### 7.2 Infrastructure & SaaS Costs (Monthly)

> **Note:** OpenAI API is NOT included in Phase 1 infrastructure. It will be added in Phase 2.

| Service | Cost + Notes |
|---|---|
| Vercel (Pro) | $20/month — needed for team access and custom domains |
| Railway (Starter) | $20/month — Node.js backend hosting |
| Supabase (Pro) | $25/month — Postgres only (database); auth is **not** Supabase Auth |
| Clerk | $0–$25/month — free tier for MVP MAU; Pro when scaling |
| Cloudinary (Free → Plus) | $0–$89/month — free tier covers MVP (25GB storage) |
| Resend Email (Free → Pro) | $0–$20/month — free for 3,000 emails/month |
| Sentry (Free) | $0/month — free tier covers MVP error monitoring |
| PostHog (Free) | $0/month — free for up to 1M events/month |
| Domain + SSL | $15/year — domain registration; SSL via Vercel/Cloudflare free |

| | |
|---|---|
| **Total Monthly Infrastructure (MVP Phase)** | **~$135–200/month** |
| 3-month runway (development period infrastructure) | ~$405–600 |

### 7.3 Total MVP Cost Summary

| Cost Category | Low Estimate | High Estimate |
|---|---|---|
| Development (51 junior days + 50 senior days + 15 design days) | $23,000 | $28,500 |
| Infrastructure (3 months during dev) | $405 | $600 |
| Contingency (15% buffer — bugs, revisions, delays) | $3,511 | $4,365 |
| **TOTAL MVP BUDGET** | **~$26,916** | **~$33,465** |

> **Cost Note — Freelance vs Agency vs In-House**
> - **Freelance Team (Tunisia):** $27,000–$34,000 — Most realistic for early-stage startup. Use Upwork/LinkedIn for vetting.
> - **Software Agency (Tunisia):** $33,000–$52,000 — Higher cost but managed process, less founder overhead.
> - **Solo Founder + 1 Senior Dev:** $14,000–$19,000 — Possible if founder is technical and handles PM/design.
> - These estimates are based on 14–16 week delivery with a 3-person team (1 senior full-stack, 1 junior, 1 designer).

---

## 8. MVP DEVELOPMENT TIMELINE

| Weeks | Module | Deliverables |
|---|---|---|
| Week 1–2 | Setup & Foundation | Repo, CI/CD, Supabase schema, Clerk auth, Next.js + NestJS scaffold, Vercel/Railway deploy |
| Week 3–4 | User System | Registration flows, role selection, artist profile, organizer profile, media upload (Cloudinary) |
| Week 5–6 | Marketplace | Artist browse page, search, filters, public profile pages, availability calendar |
| Week 7–8 | Filter Matching + Event Creation | Event brief form, basic filter matching engine (genre/city/price/availability), results display |
| Week 9–10 | Booking Engine | Request flow, quote system, in-thread messaging, booking status lifecycle |
| Week 11–12 | Contract System | PDF generation (Puppeteer), template library, digital signature widget, email delivery |
| Week 13 | Payments + Calendar | Payment intent system, commission calc, calendar auto-block, reminders |
| Week 14 | Notifications + Ratings | In-app notifications, email triggers, post-event rating, review system |
| Week 15 | Admin Panel | User management, booking oversight, payment release, basic analytics |
| Week 16 | QA, Polish, Launch | Bug fixes, cross-browser testing, performance, soft launch to 50 beta users |

> **Launch Strategy**
> - **Soft Launch (Week 16):** Invite 20–30 artists and 10–15 organizers from personal network for closed beta.
> - **Feedback Cycle (Week 17–18):** Collect data, fix critical bugs, optimize filter matching based on real usage.
> - **Public Launch (Week 19–20):** Open registration, social media campaign, targeted outreach to event agencies.

---

## 9. RISKS & MITIGATION

| Risk | Probability | Mitigation |
|---|---|---|
| Cold Start (no users) | High | Recruit 20+ artists before launch; offer free 6-month premium to early adopters |
| Payment Trust (Tunisia) | High | Start with cash/bank transfer + admin confirmation; go-live escrow in Phase 2 once trust established |
| Informal Market Habits | High | Design UX to feel familiar — WhatsApp-like messaging, simple flows, mobile-first |
| Artist Profile Quality | Medium | Onboarding wizard + completeness score; incomplete profiles flagged |
| AI Matching Accuracy (cold) | Medium | Phase 1 uses pure filters — no AI to fail. NLP matching added in Phase 2 after real data exists |
| Contract Legal Validity | Medium | Consult Tunisian lawyer for contract templates; add proper legal terms |
| Scope Creep | Medium | Strict MVP gates — features not on MVP list go to Phase 2 backlog |
| Dev Delays | Medium | 15% contingency budget + flexible timeline buffer in Week 16 |
| Payment Gateway Tunisia | Medium | Flouci/Konnect available but less mature; Stripe as backup for international |
| Double-Booking Bug | Low | Database-level unique constraint on artist + date combination |

---

## 10. BUSINESS MODEL & REVENUE

### 10.1 Revenue Streams

| Stream | Details |
|---|---|
| Commission (Primary) | 10–15% per completed booking. Deducted automatically from artist payout. Example: 500 TND booking → LIME takes 50–75 TND. |
| Agency Subscription | Monthly plan for agencies: 150–300 TND/month for VIP dashboard, roster management, master calendar. |
| Featured Listings (P2) | Artists pay for promoted placement in search results: 50–100 TND/month. |
| Premium Artist Plan (P2) | Verified badge, priority ranking, advanced analytics: 30–60 TND/month. |

### 10.2 Unit Economics (Example)

| Metric | Value |
|---|---|
| Average booking value | 400 TND (~$130 USD) |
| LIME commission at 12.5% | 50 TND (~$16 USD) per booking |
| Bookings needed for $1,000/month | ~63 completed bookings |
| Month 3 target (soft launch) | 30 bookings → ~$480 revenue |
| Month 6 target | 100 bookings/month → ~$1,600 revenue |
| Break-even (infra only, $200/month) | ~13 bookings/month |

---

## 11. NON-FUNCTIONAL REQUIREMENTS

| Requirement | Target |
|---|---|
| Performance | Page load under 2 seconds (LCP); API responses under 300ms for 95th percentile |
| Availability | 99.5% uptime target (Vercel + Railway SLAs cover this) |
| Security | API routes authenticated via Clerk JWT; Postgres via Prisma (optional Supabase RLS); HTTPS enforced; Clerk secret keys server-side only |
| Scalability | Architecture supports 10,000 users without infra changes; Railway auto-scales on demand |
| Accessibility | WCAG 2.1 AA compliance for all key flows |
| Browser Support | Chrome, Firefox, Safari, Edge — last 2 versions; mobile Chrome/Safari priority |
| Data Privacy | GDPR-adjacent practices; user data exportable/deletable; no selling of personal data |
| Localization | English primary; Arabic + French in Phase 2 (i18n framework built in from day 1) |
| SEO | Artist profile pages server-side rendered for discoverability on Google |

---

## 12. TESTING REQUIREMENTS FOR PHASE 1

> Automated tests and a manual approval gate are required before any production deployment.

### 12.1 Automated Backend Tests (Jest)

All API endpoints must have automated Jest tests covering:

- Happy path (expected inputs → expected outputs)
- Validation errors (missing fields, invalid data types)
- Auth guards (unauthenticated and unauthorized requests return 401/403)
- Business logic (booking state transitions, commission calculation, calendar conflict detection)

### 12.2 End-to-End Tests (Playwright)

Playwright E2E tests must cover the full booking flow:

- Artist registration and profile creation
- Organizer registration and event creation
- Filter matching and artist discovery
- Sending a booking request and receiving a quote
- Accepting a quote and generating a contract
- Digital signature by both parties
- Calendar auto-block after contract signing
- Post-event rating submission

### 12.3 Manual Testing Gate

**Agents cannot deploy to production until a human confirms tests pass.** The deployment workflow is:

1. Agent runs all Jest and Playwright tests in CI.
2. Agent deploys to **staging** environment only.
3. Human performs smoke tests on staging (key flows: register, create event, book artist, sign contract).
4. Human gives **explicit approval** before the agent proceeds to production deployment.

This gate applies to every release, including hotfixes.

---

## 13. DEPLOYMENT POLICY

Deployments follow a strict staging-first, human-approved workflow:

1. **Agents deploy to staging first.** No direct production deployments by agents.
2. **Human performs smoke tests** on the staging environment, verifying critical flows.
3. **Human gives final approval** for production deployment — explicit sign-off required.
4. Agent proceeds to production only after receiving approval.

This policy ensures no untested code reaches production users.

---

## 14. ZERO-DATA LAUNCH STRATEGY

The platform cannot rely on user-generated content at launch — the marketplace needs artists to be useful from day one.

### 14.1 Pre-Launch: Seed the Database Manually

Before opening public registration:

- Manually add **10–20 artist profiles** directly to the database (with artist consent).
- Cover the key genres and cities in Tunisia (Tunis, Sfax, Sousse at minimum).
- Ensure each seeded profile has a complete portfolio, pricing, and availability calendar.

### 14.2 Launch: Simple Filters, No AI Dependency

- Phase 1 filter matching works immediately with any number of artists in the database.
- There is no cold-start problem with AI because there is no AI in Phase 1.
- Even with 10 artists, organizers can create events and receive relevant filtered results.

### 14.3 Phase 2: Improve Matching After Real Data Exists

- Once the platform has **50+ active artist profiles** and real booking history, implement NLP / semantic matching.
- The Phase 2 matching engine will train on real genre preferences, event types, and booking outcomes.
- Until then, the random-sorted filter results are sufficient for MVP validation.

---

## 15. GLOSSARY & KEY TERMS

| Term | Definition |
|---|---|
| Booking Request | A formal request sent by an organizer to an artist to perform at an event |
| Quote / Devis | A structured price offer from an artist in response to a booking request |
| Contract | An auto-generated, digitally-signed legal agreement between organizer and artist |
| Escrow | Funds held by LIME platform between payment and event completion |
| Settlement | Release of held funds to the artist after event is confirmed complete |
| Commission | Platform fee (10–15%) deducted from each booking before artist payout |
| Filter Matching Engine | Phase 1 system that ranks artists based on genre, city, price, and availability filters |
| AI Matching Engine | Phase 2 NLP-based algorithm that semantically matches artists to events |
| Event OS | LIME's positioning as a full Operating System for events, not just a marketplace |
| Agency Roster | The list of artists managed by an agency on the platform |
| Availability Calendar | Artist-maintained schedule showing bookable and blocked dates |
| Digital Signature | Electronic acceptance of contract terms by both parties |
| Trust Score | Composite reputation metric based on ratings, bookings, and reliability |
| Staging Environment | A production-mirror server used for smoke testing before live deployments |
| Smoke Test | A quick human-performed verification of key flows before approving production deployment |
