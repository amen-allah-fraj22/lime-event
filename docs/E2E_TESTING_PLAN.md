# End-to-end testing plan — both roles, full authenticated journeys

Compiled 2026-08-17. Goal: real e2e coverage of the two actual user journeys (organizer and artist), signed in, all the way through — not the current situation, which only tests public pages and "redirects to sign-in."

---

## The core gap this plan closes

The existing Playwright suite (8 spec files, 39 passing) is green but shallow. Grepped every spec — **not one of them ever logs in.** They test exactly two things:

- public routes render (`/`, `/artists`)
- protected routes redirect to `/sign-in` when *not* authenticated

That means the entire product behind the login wall — post an event, browse matches, send a booking request, negotiate, sign a contract, build an artist profile, apply to perform — has **zero automated coverage.** Every "verified" note in the pre-launch plan for those flows rests on code reading, not an executed signed-in run, precisely because this environment can't log in by hand.

So this plan is really about one thing: **make automated login work**, then everything else is ordinary Playwright.

---

## The one real blocker: automated Clerk sign-in

Clerk (like most auth providers) actively resists scripted logins — bot detection, and no password in the test DB. You don't fight that by typing into the sign-in form; you use Clerk's official test path:

- **`@clerk/testing`** (not yet installed — only `@clerk/nextjs@6` is) — its Playwright helper injects a **Testing Token** that bypasses bot detection for a known dev instance.
- **Test emails** of the form `anything+clerk_test@example.com` with the fixed verification code **`424242`** — Clerk treats these as real accounts on a **development instance** without sending real email.
- Requires the **dev-instance** publishable + secret keys available to the test runner as env vars. The CI workflow already reserves the secret names — `E2E_CLERK_PUBLISHABLE_KEY`, `E2E_CLERK_SECRET_KEY`, `E2E_DATABASE_URL` — the e2e job just skips until they're set.

### What I need from you to build this (pick one)

- **Preferred:** give me a **Clerk *development* instance's** publishable key (`pk_test_…`) and secret key (`sk_test_…`) — either paste them for a local `apps/web/.env.test` (dev keys, not production, so lower stakes), or add them as the three `E2E_*` GitHub secrets and I'll wire CI. I do **not** need and won't touch your production keys.
- These are the same dev keys you already run locally today — nothing new to create, most likely.

Once I have those, I install `@clerk/testing`, write the global-setup sign-in, and none of the rest of this plan needs you again until review.

> No MCP connector helps here — this is a package + a dev key, not an integration. That's the whole ask.

---

## Architecture: sign in once per persona, reuse the session

Playwright's `storageState` pattern — a `global.setup.ts` project signs each persona in once, saves the authenticated browser state to disk, and every spec starts already-logged-in as its persona. Three personas, because the interesting bugs live at role boundaries:

| Persona | storageState file | Why |
|---|---|---|
| Organizer | `.auth/organizer.json` | posts events, sends requests, signs contracts |
| Artist — solo | `.auth/artist-solo.json` | the flow you've already tested by hand |
| Artist — **band** | `.auth/artist-band.json` | the flow you **haven't** — see the band findings below |

Each persona is a `+clerk_test` email; the setup project verifies with `424242`, completes `/onboarding/role`, and (for artists) publishes a profile so downstream specs have something to act on.

---

## Coverage matrix

### Organizer journey (happy path)
1. Sign up → `/onboarding/role` → pick Organizer → lands on dashboard
2. Create event (with a venue photo upload) → appears in `/events/mine`
3. Open `/events/[id]/matches` → sees candidate artists (needs seeded artists)
4. Send a booking request to an artist
5. Message the artist in the thread
6. Receive a quote → accept it
7. Contract generated → sign it → booking confirmed
8. Booking shows on `/calendar` and `/dashboard/bookings`
9. **Cross-role assertion:** organizer never sees artist-side pay internals they shouldn't (the thing section 3 flagged)

### Artist journey — solo (happy path)
1. Sign up → `/onboarding/role` → pick Artist
2. Wizard step 1: name, city, bio, **profile + cover photo** (the upload wired in section 9 — assert it actually persists)
3. Step 2: solo, genres, instruments
4. Step 3: demo link
5. Step 4: requirements → publish
6. Profile appears in `/explore/artists` and public `/artists/[id]`
7. Browse events → apply to perform (one-tap + note)
8. Receive/negotiate an offer → get confirmed → booking on calendar

### Artist journey — band (happy path) — **see findings; this flow is currently incomplete**
Same as solo, but the band-specific data (band name, size, per-member lineup) **cannot currently be entered in the live wizard** (details below). Two options for this row:
- **(a)** Test the *current* truthful behavior — a band can only set `artist_type: band` + a flat instrument list; assert the public profile degrades gracefully (no empty "Band members" section, subtitle reads "Band" with no member count).
- **(b)** First wire band-member entry into the live wizard (I can do this), then test the full lineup round-trips from wizard → API → public profile.

### Edge / validation / empty-state pass
- Every form: empty required fields, oversized input, Arabic/French/accented names — clear validation messages
- Brand-new account with zero events/bookings/messages — nothing renders broken or blank
- Expired/again-clicked actions (double-submit a request, re-sign a signed contract)

---

## Test-data strategy

- **Seed via the API/Prisma before a run, tear down after** — not the demo `seed.ts` (that's for dev display). A dedicated `e2e/fixtures/seed-e2e.ts` creates a known organizer, a known solo artist, and a known band artist with a fixed lineup, all prefixed `e2e_` in `clerk_user_id`, and a matching `remove` step — same guarded pattern as `prisma/remove-seed-data.ts`.
- Runs against `E2E_DATABASE_URL` — ideally a **separate throwaway database**, not the pilot one, so a failed run never pollutes real data. If there's only one DB, the `e2e_`-prefix + teardown keeps it clean, but a separate DB is the right call before there are real users.

---

## Phasing (each phase independently commit-able and green)

- **Phase A — infra:** install `@clerk/testing`, `global.setup.ts`, three storageStates, one authenticated smoke test (`/dashboard` loads as organizer). Nothing else works until this is green.
- **Phase B — organizer happy path** (matrix above)
- **Phase C — artist solo happy path**
- **Phase D — artist band** (option a or b, your call)
- **Phase E — cross-role booking/negotiation/contract** (the two personas interacting on one booking)
- **Phase F — validation + empty states**

Each phase keeps the "run against a production build, not dev server" rule already documented in pre-launch section 3 (dev-server on-demand compile causes false timeouts).

---

## What I need from you — checklist

- [ ] A **Clerk dev instance** publishable + secret key for the test runner (local `.env.test` or the three `E2E_*` GitHub secrets). **This is the only hard blocker.**
- [ ] Decide the **band** row: test current limited behavior (a), or let me wire band-member entry into the live wizard first, then test it (b).
- [ ] Confirm whether e2e can have its **own database** (`E2E_DATABASE_URL` ≠ pilot DB) — strongly recommended before real users exist.

Everything else — packages, setup code, specs, fixtures, CI wiring — is mine once the key is available.
