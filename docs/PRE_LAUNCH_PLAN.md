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

### CI had never run — the workflow was in the wrong directory

`playwright.yml` lived at `apps/web/.github/workflows/`. GitHub only reads workflows from the **repository root** `.github/workflows/`, so this workflow had never executed a single time. It also would not have worked if it had: GitHub Actions sets `CI=true`, which makes `playwright.config.ts` skip its own `webServer` block, so no servers would have started at all.

Replaced with a root `.github/workflows/ci.yml` containing two jobs:

- **`checks`** — typecheck (api + web), lint, and API unit tests. Needs no secrets and no database, so it works on a fresh clone and on forks. All three steps verified locally before commit.
- **`e2e`** — builds for production and runs Playwright against it. Needs a database and a real Clerk instance, so it **skips with a notice** unless `E2E_DATABASE_URL`, `E2E_CLERK_PUBLISHABLE_KEY` and `E2E_CLERK_SECRET_KEY` repository secrets are set, rather than failing red for a reason no pull request can fix.

**➡️ Action for you:** add those three repository secrets in GitHub (Settings → Secrets and variables → Actions) to turn the e2e job on. Until then it is skipped by design.

New scripts to support this, usable locally too: `npm run typecheck`, `npm run lint:web`.

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

## 4. Mobile optimization — ⚠️ done except real-device testing (2026-08-06)

The product is built mobile-first (bottom nav, slim top bar), which is right for this audience — but "mobile-first" needs to mean "mobile-verified," not just "mobile-styled."

- [x] Test at real breakpoints: 375px (small phone), 390px (standard iPhone), 428px (large phone), 768px (tablet portrait) — audited via emulated viewports on landing, `/explore/artists` (incl. the filter panel), `/explore/events`, `/sign-in`, `/sign-up`. **Zero horizontal overflow at any breakpoint.**
- [x] Confirm touch targets are ≥44px — three real defects found and fixed (below); the "Popular genres" and "Artist type" filter chips were widened but deliberately kept under 44px (see note).
- [x] Confirm the bottom nav never overlaps content — **found and fixed a real bug** (below), not the same one as the earlier screenshot.
- [ ] Test on an actual iOS Safari and Android Chrome device — **not done, cannot be done from this environment.** Everything above was verified with emulated viewports and CSS math, not a physical device. Treat this checkbox as the one still open.
- [x] Confirm forms don't trigger unwanted zoom on input focus (iOS zooms if font-size < 16px) — fixed globally.
- [ ] Test image upload flow (artist photos, new venue photo) from an actual phone camera roll — not done, needs a physical device.

### Bugs found and fixed

**Bottom nav overlaps content on any device with a home indicator.** `MobileBottomNav` adds `env(safe-area-inset-bottom)` as *padding* on top of its own ~75px height, but both `AppShell` and `DashboardShell` reserved a flat `pb-24` (96px) for it — correct only when the inset is 0. On a notched/home-indicator phone (inset ≈34px) the nav becomes ~109px while content still stops 96px from the bottom, so **the last ~13px of every page sits behind the nav.** This reproduces only on real hardware, not in devtools responsive mode (which reports a 0px inset) — that's almost certainly why it wasn't caught before. Fixed by making both shells reserve `calc(6rem + env(safe-area-inset-bottom))` instead of a flat value.

**iOS zoom-on-focus.** Most text inputs across the app render at 14px (`text-sm`), below the 16px Safari uses as its zoom threshold — every one of them would trigger an unwanted pinch-zoom on focus. Fixed once, globally, in `globals.css`: a `max-width: 767px` rule forces 16px on all text-entry inputs, selects and textareas (checkboxes/radios/range/color excluded, since they don't trigger the zoom and some rely on their own sizing). Desktop keeps its denser 14px.

**Three genuinely small tap targets:**
- Footer link list (`How it Works` / `Pricing` / `Learn more` ×6): 21px-tall hit areas from `space-y-2` with no padding on the links themselves. Fixed with `py-2.5` on each link → 44px.
- Password show/hide toggle on both sign-in and sign-up: icon-only button with no padding, 20×27px. Fixed to a proper `h-11 w-11` (44×44) hit area; also had to add `shrink-0` because the sibling input's `w-full` inside the flex row was compressing the button via flex-shrink before that.
- Equipment-filter checkboxes (`Sound system` / `Lighting` / `Mixing desk`) on `/explore/artists`: the `<label>` wrapping each — the real hit target, not the 13px checkbox itself — was only 20px tall. Fixed with `py-3` → 44px.

**Deliberately not taken to 44px:** the "Popular in Tunisia" genre chips and the Solo/Band/All artist-type chips. These are secondary quick-picks (the primary genre control is the dropdown above them); at 8 wrapped chips, forcing each to 44px would meaningfully bloat the filter panel for a compact, common chip-filter pattern that Material and Apple both treat as an accepted exception to the 44px guideline. Nudged from 26px to 34px instead — closer to compliant, without the layout cost.

**Verification:** `npm run typecheck` (api+web) 0 errors, `npm run lint:web` 0 warnings, `npm run test:api` 14/14, full Playwright suite 40/40 — all re-run after these changes, no regressions.

## 5. Desktop / tablet pass — ⚠️ done except one thing verifiable from here (2026-08-11)

- [x] Confirm the 59 (now 58 — one page removed in section 2) files without explicit breakpoint classes don't look broken or absurdly stretched above 768px — most are non-visual (providers, context) or intrinsically simple (logo, icons, loading states) and genuinely don't need breakpoints. The page-level ones render through components that do have breakpoints (`DashboardShell`, `BrowseArtistsPage`, `CalendarPage`, etc.), and those were the actual concern — covered by the other two items below.
- [x] Confirm the multi-column grids (event cards, artist browse) reflow sensibly at 1024px, 1440px, ultra-wide — both grids are wrapped in a real `max-width` container (`max-w-[1600px]` for artists, `max-w-container-max` for events), confirmed live: at 2560px viewport, content correctly caps at 1280px and stays centered rather than stretching. **Caveat:** the seed database in this environment has no artists/events, so the actual card grid reflow (2→3 columns etc.) couldn't be watched with real content — only the container behavior was verified.
- [x] Confirm no mobile-only UI (bottom nav) leaves desktop users without an equivalent way to navigate — **found and fixed a real, significant bug** (below).

### Bug found: desktop users on several core routes had zero primary navigation

`MobileTopBar` (rendered on every `AppShell`-only route, unconditionally, at every breakpoint) had a literally empty desktop nav slot:
```
{/* Center — Page title on desktop, hidden on mobile */}
<div className="hidden md:flex items-center gap-6">
  {/* Desktop nav links can go here later if needed */}
</div>
```
Combined with `MobileBottomNav` correctly hiding itself at `md:` (by design — it's mobile-only), this meant that on desktop, a signed-in user on **`/explore/artists`, `/explore/events`, `/messages`, `/requests`, `/profile`, `/artists/[id]`, `/artists/[id]/edit`, `/admin`, or `/events/mine`** had no way to navigate the app at all — only a notification bell and an avatar link to `/profile`. Explore and Messages are core to the booking flow; this wasn't a cosmetic gap.

A second, related gap: even `DashboardShell`'s desktop sidebar (used by Dashboard/Bookings/Calendar/Notifications/Events — the routes that *do* have a real desktop nav) was missing **Messages** and **Requests** entirely, despite both being in the mobile bottom nav. Only "Browse Artists" was present as a lone extra link, and it was hardcoded to `/explore/artists` regardless of role — wrong for artist users, who'd want `/explore/events`.

**Fixed both, from one source of truth:**
- `MobileTopBar` now renders a real, active-state-aware desktop nav (only when signed in) sourced from `NAV_TABS_BY_ROLE` — the exact same role-keyed tab list `MobileBottomNav` already uses, so mobile and desktop nav can no longer silently diverge.
- `DashboardShell`'s `ORGANIZER_NAV` / `ARTIST_NAV` now include Explore, Requests and Messages; the redundant/role-wrong "Browse Artists" link was removed.

**Verification:** signed-out state confirmed live (nav correctly absent, `Log in`/`Sign up` still render, no overflow, no console errors) at 1440px. The signed-in nav render **could not be visually confirmed** — this environment has no real Clerk credentials to log in with. Confirmed instead by: `tsc` 0 errors, `next lint` 0 warnings, no import cycle between `MobileTopBar`/`MobileBottomNav`, and the fact that `NAV_TABS_BY_ROLE` is the same data structure already exercised by the (working, tested) mobile bottom nav. **Worth a real logged-in click-through before launch**, same caveat as the mobile real-device testing in section 4.

`npm run test:api` 14/14, Playwright 39 passed / 1 skipped (data-dependent, unrelated to this change) — re-run after these changes, no regressions.

## 6. UX/UI review — ✅ done (2026-08-11)

- [x] Resolve the `/artists` vs `/explore/artists` duplication — already done in section 2, confirmed still in place.
- [x] Confirm the one-tap apply + optional note pattern reads well across every event card — **found and fixed a critical functional bug**, not a cosmetic one (below).
- [x] Confirm loading states are consistent — audited every route; genuinely fine, no fix needed (below).
- [x] Confirm error states are human-readable everywhere — found and fixed 4 real instances of the same anti-pattern (below).
- [x] Review copy for tone consistency — sampled empty-state/CTA copy across the app; one flat outlier fixed, everything else already matches the established "No X yet" / warm terse voice.
- [x] Accessibility pass — found and fixed 6 real gaps (below).
- [x] Confirm color contrast on lime-green primary buttons — **measured programmatically (WCAG relative-luminance formula), not eyeballed**: every lime-on-dark and dark-on-lime pairing in the app passes AA with real margin (8.1:1 to 16.3:1), several exceed AAA (7:1). The plan's worry didn't hold up under actual measurement — no fix needed.

### Critical bug found: "Apply to Perform" was completely broken for every user

While verifying the apply flow reads well across cards, found that `handleApply` in `explore/events/page.tsx` called `GET /auth/me` to fetch the artist's profile ID before submitting — **that route does not exist**. The `/auth` controller only has `POST /auth/sync`; the real endpoint is `GET /users/me` (which already returns the exact `artist_profile.id` shape the code expected — the bug was purely the URL, not the logic around it). Every attempt to apply to an event, by any artist, at any time, hit a 404 and silently failed via a blocking native `alert()`. Fixed the URL, verified live end-to-end: before the fix, clicking apply produced `Cannot GET /auth/me`; after, it correctly produces `401 Unauthorized` for an anonymous session (the correct behavior) and would succeed for a signed-in artist. This is the most serious finding across sections 1-6 — it wasn't a UX polish item, it silently disabled a core feature.

Also while in that file: added `line-clamp-2` to event titles (previously unbounded, real overflow risk with a long title in a 3-column grid — every sibling component with card titles already truncates, this one didn't) and softened one flat empty-state line ("No public events currently available." → "No public events yet — check back soon.").

### Error states: same alert()-vs-inline anti-pattern found in 2 files, fixed in 4 places

Every request/apply flow in the app (`SendBookingRequestModal`, `RequestBookingModal`, `BrowseArtistsPage`, `CalendarPage`, `ArtistDashboard`, etc.) surfaces failures via `setError(...)` + an inline styled banner (`ErrorAlert` or equivalent) — a real, consistent convention. Two files broke it with a blocking native `alert()`:
- `explore/events/page.tsx` — apply failures (see above).
- `CalendarManageSidebar.tsx` — day-status changes, adding a personal event, and deleting an event, 3 separate call sites.

All 4 now use the same `setError` + inline-banner convention as everywhere else. (The `confirm('Delete this event?')` in the same file is a different category — a destructive-action guard, not an error display — and was left as-is; native `confirm()` for a simple "are you sure" is still an accepted, common pattern.)

### Dead code removed

`components/lime/events/ExploreEventsPage.tsx` — an orphaned, never-imported legacy version of the events-browse screen. Confirmed via full-codebase search that nothing referenced it. It fetched the wrong endpoint (`/events/mine`, an organizer's own events, not a public browse list) and its "apply" handler was a literal placeholder (`await new Promise(r => setTimeout(r, 800))`, no real API call, comment: *"Placeholder — will use POST /booking-requests... in Phase 2"*). Never reachable by a real user, but worth deleting before it confuses a future edit or gets accidentally wired up.

### Loading states: audited, genuinely fine

Traced every route with its own loading state. The pattern is healthier than the checklist worried: most list/grid pages (`BrowseArtistsPage`, `explore/events`, `explore/artists`'s underlying data, `messages`, `requests`) use purpose-built skeleton loaders (`animate-pulse` cards shaped like the real content, plus `aria-busy` and contextual text like "Updating results…" on `BrowseArtistsPage`) — a deliberately *better* pattern than a generic spinner, not a gap. `LoadingBlock` (the generic spinner) is used where that's the right call — simpler pages and modals. Button-level actions (`AddRolePromptModal`, `CalendarSyncButton`) correctly show a disabled+text-change state rather than a page-level spinner. No blank-during-fetch gaps found anywhere.

### Accessibility: 6 real gaps found and fixed

- `ArtistPhotoUpload`'s upload button had no accessible name when a photo was already set (the only content was a correctly-decorative `alt=""` thumbnail) — a screen reader would announce it as just "button". Added a dynamic `aria-label` ("Upload {label}" / "Change {label}").
- Calendar prev/next-month buttons (`CalendarPage`) were icon-only with no label. Added "Previous month" / "Next month".
- The venue-photo remove button (`CreateEventWizard`) was icon-only with no label. Added "Remove venue photo".
- The notification bell — the exact element the checklist named — had no label, in **two independent places** (`MobileTopBar` and `DashboardShell`'s own desktop header). Both fixed; `MobileTopBar`'s also states the unread count when >0.
- The avatar link — also named in the checklist — had no label in `MobileTopBar`. Fixed ("Your profile").
- Nav icons — checked and already fine: both `MobileBottomNav` and the new desktop nav (section 5) render visible text labels next to every icon, so no accessible-name gap there.

Scanned every `<img>`/`<Image>` in the app for missing `alt`: all had one already (a broad grep initially flagged 8 files, but all were false positives from a single-line pattern match — the `alt=` was present on the next line in every real case).

**Verification:** `npm run typecheck` 0 errors, `npm run lint:web` 0 warnings, `npm run test:api` 14/14, Playwright 39 passed / 1 skipped (same data-dependent skip as before, unrelated) — re-run after every change in this section.

## 7. Payment & pricing honesty check — ✅ done (2026-08-15)

- [x] Fix `COMMISSION_RATE` to match the plan — already done in section 2 (progressive 7%/5%/3% tiers). Confirmed still intact.
- [x] Audit every screen mentioning money/fees/commission for false automation claims — **found and fixed a serious, repeated problem** (below), including one inside the actual signed contract text.
- [x] Make booking confirmation screens explicit that payment is manual for now — added a payment-honesty note at the one place both roles see the agreed fee (`OfferSheet`), plus the organizer timeline.

### The landing page — and the legal contract text — both claimed a payment feature that doesn't exist

Grepped every screen mentioning money/fees/escrow/commission. The public marketing site and the contract-signing flow both repeatedly promised **"secure escrow payments"** and **"guaranteed payments via escrow"** — six separate claims across the hero copy, the "old way vs. LIME way" comparison, the "How it works" steps, and both the organizer and artist benefit lists. Per section 0's original finding, payments is a DB-state stub — nothing calls Flouci, and the business plan explicitly states payment stays manual for the pilot's first 2 months. None of that was reflected anywhere a user could see.

**Worse: the contract-signing screen (`SignContractPage.tsx`) has a fallback clause that literally states "Payment terms follow the LIME escrow process"** in the terms a real artist and organizer digitally sign. Traced where that text comes from — the three real, server-generated contract templates (`private.html`, `wedding.html`, `corporate.html`) are actually fine; none of them mention escrow, they just say "Full fee payable via LIME platform." The false claim was isolated to the frontend's fallback text (shown if the real contract-preview API call is slow or fails), but since it's reachable by a real user reviewing what they're about to sign, it needed the same fix. Rewrote it to match what the real templates already say honestly.

All 6 landing-page claims rewritten to describe what's actually true — verified contracts, transparent contract-backed pricing — without the word "escrow" or "guaranteed."

### Also found while auditing: fabricated social proof, unrelated to payment but caught in the same pass

The landing page had 3 fake testimonials attributed to named people ("Mehdi T., Musician," etc.) — two of which specifically praised the non-existent escrow feature — plus fabricated numbers ("Trusted by 500+ organizers," "hundreds of verified artists," animated counters claiming "200+ Verified Artists / 500+ Events Booked / 98% Satisfaction"). This is a different category of problem (fake people and fake stats, not specifically payment) so it was flagged and confirmed with you rather than removed unilaterally. **Decision: removed entirely** — the whole testimonials/stats section, the fake avatar-stack trust badge, and the "500+"/"hundreds of" claims, replaced with an honest "Now booking artists across the Grand Tunis area." The now-fully-unused `useStatCounters` hook was deleted too (confirmed via search — nothing else referenced it).

### Booking-confirmation payment honesty

Traced the confirmed-booking view (`OfferSheet`, the component both organizer and artist see once a booking is confirmed, showing the agreed fee) — there was no payment-timing guidance there at all, a real gap matching the checklist's exact worry. Added a note directly under the agreed-fee amount: *"LIME does not process payments automatically yet — arrange payment method and timing directly with the other party via the conversation below."* Also added an equivalent note to the organizer-side booking timeline, under the "Contract signed" step.

**Verification:** `npm run typecheck` 0 errors, `npm run lint:web` 0 warnings, `npm run test:api` 14/14, Playwright run against a **production build** (per the section 3 procedure) 40 passed / 0 failed — re-run twice, after the payment-copy fixes and again after the testimonials removal.

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
