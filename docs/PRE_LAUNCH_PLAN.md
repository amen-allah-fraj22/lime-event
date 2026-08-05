# LIME EVENTS — Pre-Launch Plan

Compiled from a codebase deep-analysis on 2026-08-03. Covers testing, bug fixes, mobile optimization, UX/UI, and everything else standing between now and inviting real artists to create accounts.

---

## 0. Findings from the deep analysis (why this plan looks the way it does)

- **Git safety: 179 uncommitted files, 1 commit total.** Every fix and feature built since the initial commit — including today's — is sitting unprotected in the working directory. No rollback point exists.
- **Payments is a DB-state stub, not a real integration.** `payments.service.ts` moves records through `pending → held → released`, but nothing calls Flouci. Matches the business plan's "no payment module for the first 2 months" — but only if the UI is honest about that everywhere.
- **Commission rate mismatch.** Code defaults to `COMMISSION_RATE = 0.125` (12.5%). The business plan (and expert-reviewed pricing policy) settled on a 7% progressive rate. This is a real discrepancy between what's coded and what's promised.
- **Clerk is on test keys** (`pk_test_...`). Fine for internal testing, not for real artists signing up with real emails.
- **Duplicate browse-artist routes.** `/artists` and `/explore/artists` are two separate pages doing overlapping jobs — worth deciding which is canonical before sending artists a link.
- **One layout bug found and fixed this session**: `/messages/[bookingId]` was double-wrapping the page shell (two headers stacked). Fixed by pattern-matching against the correct sibling route (`/bookings/[id]`) — not yet visually re-verified against a live login.
- **E2E coverage exists** (8 Playwright spec files: auth flow, marketplace flow, phase1–3 role flows, booking timeline logic, API integration, health check) but hasn't been run since the single initial commit — current pass/fail state is unknown.
- **Responsive coverage is partial**: only 44 of 103 page/component files use `sm:`/`md:`/`lg:` breakpoint classes. The shell (`AppShell`) is explicitly mobile-first (bottom nav hidden `md:`+), which is the right call for this product, but it means desktop is the less-tested surface, not mobile.
- **Accessibility coverage is light**: 19/103 files use `aria-*` attributes, 12/103 have `alt=` text on images.
- **30 distinct routes** span public marketing, organizer dashboard, artist dashboard, booking/negotiation flow, calendar sync, contracts, admin, and notifications — a lot of surface area for a first pilot.

---

## 1. Safety & housekeeping (do first, before touching anything else)

- [ ] Review the 179 uncommitted files (`git status`), commit in logical chunks (not one giant commit)
- [ ] Push to remote so the work exists outside this one machine
- [ ] Decide: is `.env.local` / real secrets accidentally staged anywhere? Double-check before pushing
- [ ] Set up a `staging` branch so future work doesn't land directly on `main` untested

## 2. Known bugs to fix before launch

| Bug | Status | Notes |
|---|---|---|
| Duplicate header on `/messages/[bookingId]` | Fixed, not visually re-verified | Needs a real login to confirm in-browser |
| Commission rate 12.5% vs plan's 7% | **Not fixed** | `apps/api/src/payments/payments.service.ts` — `COMMISSION_RATE` env default |
| `/artists` vs `/explore/artists` duplication | **Not resolved** | Decide canonical route, redirect or remove the other |
| Unknown bugs | **Unaudited** | No systematic pass has been done outside of the specific things caught by accident this session |

## 3. Full regression pass (systematic, not incidental)

Everything below should be run and the results recorded — not just "looked fine while I was doing something else."

- [ ] Run the existing Playwright suite (`npm run test:e2e -w @lime/web`) and fix whatever's red
- [ ] Run `next lint` on the web app and `tsc` typecheck on both apps — fix or consciously accept every warning
- [ ] Manual click-through as **organizer**: sign up → onboarding → post event (with venue photo) → view matches → message an artist → accept a quote → confirm booking → view calendar
- [ ] Manual click-through as **artist**: sign up → onboarding → build profile → browse events → apply (one-tap + optional note) → negotiate → get confirmed → view calendar
- [ ] Cross-role: does an organizer ever see artist pay/pricing anywhere they shouldn't (this was explicitly removed earlier — confirm it stayed removed)
- [ ] Every form: submit with empty required fields, oversized inputs, special characters (Arabic/French names, accents) — confirm validation messages are clear
- [ ] Every list/empty state: what does a brand-new account see with zero events/bookings/messages? Confirm nothing renders broken or blank

## 4. Mobile optimization

The product is built mobile-first (bottom nav, slim top bar), which is right for this audience — but "mobile-first" needs to mean "mobile-verified," not just "mobile-styled."

- [ ] Test at real breakpoints: 375px (small phone), 390px (standard iPhone), 428px (large phone), 768px (tablet portrait)
- [ ] Confirm touch targets are ≥44px (buttons, nav icons, form controls) — several buttons observed today were borderline small
- [ ] Confirm the bottom nav never overlaps content (recall the "Apply to Perform" button being partially obscured by the nav bar in one screenshot this session)
- [ ] Test on an actual iOS Safari and Android Chrome device, not just responsive-mode in devtools — Safari's viewport/safe-area handling differs
- [ ] Confirm forms don't trigger unwanted zoom on input focus (iOS zooms if font-size < 16px on inputs)
- [ ] Test image upload flow (artist photos, new venue photo) from an actual phone camera roll, not just desktop file picker

## 5. Desktop / tablet pass (the less-tested surface)

- [ ] Confirm the 59 files without explicit breakpoint classes don't look broken or absurdly stretched above 768px
- [ ] Confirm the multi-column grids (event cards, artist browse) reflow sensibly at 1024px, 1440px, ultra-wide
- [ ] Confirm no mobile-only UI (bottom nav) leaves desktop users without an equivalent way to navigate

## 6. UX/UI review

- [ ] Resolve the `/artists` vs `/explore/artists` duplication — one canonical browse experience
- [ ] Confirm the one-tap apply + optional note pattern (shipped today) reads well across every event card, not just the ones tested
- [ ] Confirm loading states are consistent (some routes show `LoadingBlock`, others might not — audit for gaps)
- [ ] Confirm error states are human-readable everywhere (not raw API error strings)
- [ ] Review copy for tone consistency — "Fresh bookings, fresh talent" positioning should carry through every screen, not just the landing page
- [ ] Accessibility pass: add `alt` text to remaining images, `aria-label`s to icon-only buttons (notification bell, avatar, nav icons)
- [ ] Confirm color contrast on the lime-green primary buttons meets WCAG AA (light green + black text can be borderline)

## 7. Payment & pricing honesty check

- [ ] Fix `COMMISSION_RATE` to match the plan (7% progressive, or at minimum the flat 7% base tier as the coded default)
- [ ] Audit every screen that mentions money/fees/commission — does the UI ever imply automated payment exists when it doesn't yet?
- [ ] If payment truly stays manual for the pilot's first 2 months (per the business plan), make sure booking confirmation screens say so explicitly, so artists and organizers aren't confused waiting for a payment that isn't automated yet

## 8. Auth & production readiness

- [ ] Move off Clerk test keys to a real (or dedicated staging) instance before any real artist creates an account with a real email
- [ ] Confirm Clerk redirect URLs / allowed origins are configured for the actual deployment domain, not just localhost
- [ ] Decide and document: where does this actually get hosted for the pilot? (Vercel for web, Railway/similar for API — per the business plan's cost assumptions)
- [ ] Confirm environment variables are fully set for that real deployment target (`.env.example` vs what's actually needed — diff them)

## 9. Content & data readiness

- [ ] Replace/remove seed/demo data (`yasmine.demo@...`, `djkarim.demo@...`, etc.) so real artists don't see fake accounts
- [ ] Prepare the actual onboarding copy/instructions to send artists (what they need to have ready: photos, bio, pricing expectations, availability)
- [ ] Decide the actual invite mechanism — direct link? Waitlist? Manual approval for the first cohort?

## 10. Go/no-go checklist (final gate before sending invites)

- [ ] All of section 1 (safety) done
- [ ] All bugs in section 2 fixed and re-verified live (not just pattern-matched)
- [ ] Full regression pass (section 3) green
- [ ] Mobile pass (section 4) done on a real device
- [ ] Commission rate matches the plan
- [ ] Auth is on non-test keys
- [ ] Hosting target decided and environment variables set for it
- [ ] Someone who isn't you has clicked through the full artist sign-up flow once, cold, and reported confusion points

---

*This plan should be treated as a living checklist — check items off directly in this file as they're completed, and add anything new that surfaces during the regression pass.*
