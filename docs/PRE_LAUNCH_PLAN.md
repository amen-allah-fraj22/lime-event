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

## 1. Safety & housekeeping — ✅ DONE (2026-08-05)

- [x] Review the 179 uncommitted files (`git status`), commit in logical chunks (not one giant commit)
- [x] Push to remote so the work exists outside this one machine
- [x] Decide: is `.env.local` / real secrets accidentally staged anywhere? Double-check before pushing
- [x] Set up a `staging` branch so future work doesn't land directly on `main` untested

**What was done:** 10 commits (`7f8889b..7f26dec`) organised by domain — repo config, API layer, artist wizard, explore/events, booking & messaging, calendar, auth & mobile shell, e2e tests, project config/docs, and the untracking commit. Pushed to `origin/main`. `staging` branch created from `main` and pushed; **all further pre-launch work happens on `staging`.**

**Secrets audit: clean.** `.env`, `apps/api/.env` and `apps/web/.env.local` are all correctly gitignored. Every secret-shaped string in a committed file is a placeholder (`sk_test_placeholder`, `[YOUR-PASSWORD]`, `YOUR_PROJECT_REF`). No credential was ever committed.

**PII leak caught and blocked.** `prompt for agent .md` contained the founder's full name, date of birth, city, phone number and email. The repository is public, so committing it would have exposed that permanently. It is now gitignored.

**~70 files deliberately excluded** from this public repo (all still on disk, just untracked): business plans, financial models, the founder's CV, market research, LaTeX sources/artifacts, the one-off Excel analysis scripts, working/backup folders, and the UI design mockups.

**⚠️ Known limitation — history is not rewritten.** `deep-research-report.md` (competitor analysis) and `stitch_lime_event/` (design mockups) were untracked, but they were present in the **initial commit**, so they remain retrievable from git history and have been publicly visible since that commit. Removing them for real requires a history rewrite (`git filter-repo` / BFG) plus a force-push, which rewrites every commit hash — deliberately **not** done. Decide explicitly whether this matters before launch.

## 2. Known bugs to fix before launch — ✅ DONE (2026-08-05)

| Bug | Status | Notes |
|---|---|---|
| Duplicate header on `/messages/[bookingId]` | ✅ Fixed & confirmed | `BookingConversationView` renders its own back-header, so the extra `AppShell` wrapper produced two. Now identical in structure to the sibling `/bookings/[id]`. Still worth a logged-in visual pass in section 3. |
| Commission rate 12.5% vs plan's 7% | ✅ Fixed | Replaced the flat 12.5% with the **published progressive scale** — 7% / 5% / 3% by band, applied like a tax bracket. 7 unit tests cover both boundaries, the 600 TND pilot average and a zero fee. |
| `/artists` vs `/explore/artists` duplication | ✅ Resolved | `/explore/artists` is canonical (bottom nav, dashboard + role-switcher target, only one that can open a booking request). `/artists` now 308-redirects to it; duplicate page removed; internal links repointed. `/artists/[id]` and `/artists/me` untouched. **Verified live: `/artists` → `/explore/artists`.** |
| Unknown bugs | ✅ First audit done | Typecheck found **7 latent errors**, all now fixed (see below). Runtime/behavioural auditing still belongs to the section 3 regression pass. |

**The public landing page was advertising the wrong price.** Beyond the API default, `LandingPage.tsx` displayed "12.5% fee" to every visitor — contradicting the business plan sent to the expert. Now shows 7%, verified rendering live.

**Two latent type bugs found by the first `tsc` run** (silent at runtime, but the compile was broken):
- `CalendarEntry.kind` omitted `'google_event'`, even though the calendar creates entries with that kind from the API's `google_events` payload and then filters and styles by it — every such comparison was statically impossible, so synced Google Calendar entries could never be treated correctly.
- `ArtistProfileFull` omitted `pricing_min` / `pricing_max`, which exist on the Prisma model and are read by the wizard's pricing step.

**Current state: web typecheck 0 errors (was 7), API typecheck 0 errors, all 14 API tests pass.**

## 3. Full regression pass (systematic, not incidental) — 🟡 AUTOMATED PART DONE (2026-08-05)

Everything below should be run and the results recorded — not just "looked fine while I was doing something else."

- [x] Run the existing Playwright suite (`npm run test:e2e -w @lime/web`) and fix whatever's red — **now 39 passed / 0 failed**
- [x] Run `next lint` on the web app and `tsc` typecheck on both apps — fix or consciously accept every warning — **lint 0 warnings, tsc 0 errors on both apps**

### How to run the e2e suite (important)

**Run it against a production build, not the dev server.** The suite had never been run since the initial commit; the first run was 26 failures out of 40, every one a `page.goto` timeout — all caused by Next dev compiling routes on demand and blowing past the timeout, not by product defects. Evidence:

| Target | Result | Duration |
|---|---|---|
| Dev server, cold | 26 failed / 14 passed | 26.9 min |
| Dev server, warm | 9 failed / 9 flaky / 22 passed | — |
| **Production build** | **39 passed / 0 failed** | **~5 min** |

```bash
npm run build:web && npx playwright test --reporter=list
```
Start the production server first (a `web-prod` launch config now exists), keep the API on 3001, and set `CI=1` so Playwright reuses the running servers instead of starting its own.

### Two genuine test defects found and fixed

- **phase3-organizer** asserted on the literal text `"Toggle Filters"` for the mobile filter trigger. That control exists but is labelled "Filters" — the assertion had been stale for a while. Now targeted by `data-testid="mobile-filter-toggle"` (with `aria-expanded`), so it survives copy changes.
- **marketplace-flow**'s empty-state regex included `/browse/`, which also matched the "Browse artists" heading and caused a strict-mode violation whenever artists existed. Tightened to `/no artists match/`.
- Playwright timeout raised 30s → 60s: auth-guarded routes redirect through Clerk, and slow round trips there were the only remaining source of flakiness.

### Lint was never configured

`next lint` had no config and only offered to create one. Added `next/core-web-vitals`, then resolved all 5 warnings it surfaced:

- **Real a11y defect**: `FilterCombobox` had an element with `role="option"` missing the required `aria-selected`.
- **Real external dependency**: `CalendarSyncButton` hot-linked its Google Calendar icon from **Wikimedia Commons** — a third-party request on every render that breaks offline and on restricted networks. Replaced with a local asset (`/media/google-calendar.svg`).
- Three `react-hooks/exhaustive-deps` warnings are the same deliberate pattern (depending on a stable primitive like `?.id` / `?.status` instead of an object whose identity changes every render). **Consciously accepted**, each documented inline with the reason rather than silently widening the dependency array.

**Production build succeeds** (25/25 static pages) — a pre-launch gate in its own right.

### ⚠️ Still outstanding — needs a human

The manual click-throughs below **cannot be automated here**: they require signing in with real credentials, which the assistant must not do. These are yours to run.
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
