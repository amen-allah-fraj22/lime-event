# LIME Event — Comprehensive Testing Guide

Use this document as a checklist to manually verify all user flows, edge cases, and scenarios in the LIME Event platform.

---

## 1. The Organizer Flow (Client)

The Organizer is the user who wants to find and book an artist for an event.

### Scenario 1.1: Registration & Onboarding
- `[ ]` **Action:** Go to `http://localhost:3000/sign-up`.
- `[ ]` **Action:** Create a new account using Clerk (email or Google).
- `[ ]` **Expected:** User is redirected to the role selection screen.
- `[ ]` **Action:** Select **"Organizer"**.
- `[ ]` **Expected:** Redirected to `/dashboard` (Organizer view).

### Scenario 1.2: Creating an Event
- `[ ]` **Action:** Click "Create Event" on the dashboard.
- `[ ]` **Action:** Fill in the event details (Title, Date, Time, Location, Budget).
- `[ ]` **Action:** Submit the form.
- `[ ]` **Expected:** The event appears in the Organizer's "My Events" list.

### Scenario 1.3: Browsing & Filtering Artists
- `[ ]` **Action:** Navigate to `/artists` (Browse Artists).
- `[ ]` **Expected:** All verified artists in the database are displayed.
- `[ ]` **Action:** Test the **City** filter (e.g., type "Tunis").
- `[ ]` **Expected:** Only artists in Tunis should appear.
- `[ ]` **Action:** Test the **Budget** filter slider.
- `[ ]` **Expected:** Artists with a minimum price higher than the slider should disappear.

### Scenario 1.4: Booking Request (The Core Flow)
- `[ ]` **Action:** Click "View Profile" on an artist card.
- `[ ]` **Action:** Click "Send Request".
- `[ ]` **Action:** Select the event you created earlier from the dropdown and submit.
- `[ ]` **Expected:** The UI shows a success message. The booking appears as `pending` in your Dashboard.

---

## 2. The Artist Flow

The Artist receives requests, manages their profile, and signs contracts.

### Scenario 2.1: Registration & Profile Setup
- `[ ]` **Action:** Open an Incognito window or use a different browser.
- `[ ]` **Action:** Go to `http://localhost:3000/sign-up` and create a new account.
- `[ ]` **Action:** Select **"Artist"** during role selection.
- `[ ]` **Action:** Navigate to your Profile Settings.
- `[ ]` **Action:** Fill out your Bio, Genres (e.g., "DJ, Wedding"), City, and Pricing Range.
- `[ ]` **Expected:** When you switch back to the Organizer window and refresh `/artists`, your new artist profile should appear.

### Scenario 2.2: Handling Booking Requests
- `[ ]` **Action:** (Assuming the Organizer sent a request) Check your Artist Dashboard (`/dashboard`).
- `[ ]` **Expected:** You should see a `pending` booking request.
- `[ ]` **Action:** Click on the request to view details (event location, date, organizer).
- `[ ]` **Action:** **Decline** the request.
- `[ ]` **Expected:** Status changes to `declined` for both the artist and the organizer.

### Scenario 2.3: Submitting a Quote
- `[ ]` **Action:** Have the Organizer send a *new* request.
- `[ ]` **Action:** In the Artist Dashboard, view the new request and click **Accept & Quote**.
- `[ ]` **Action:** Enter a price (e.g., 500 TND) and submit.
- `[ ]` **Expected:** Status changes to `quoted`.

---

## 3. The Negotiation & Contract Flow (Both Users)

This tests the interaction between the Organizer and the Artist after a quote is sent.

### Scenario 3.1: Accepting the Quote
- `[ ]` **Action:** Switch back to the Organizer window.
- `[ ]` **Action:** Go to Dashboard → Bookings.
- `[ ]` **Expected:** The booking status is now `quoted` showing the 500 TND price.
- `[ ]` **Action:** Click "Accept Quote".
- `[ ]` **Expected:** Status changes to `contract_pending`.

### Scenario 3.2: Signing the Contract
- `[ ]` **Action:** The Organizer clicks "Sign Contract".
- `[ ]` **Action:** Read the auto-generated contract and type full name to sign.
- `[ ]` **Action:** Switch to the Artist window.
- `[ ]` **Action:** The Artist also clicks "Sign Contract" and signs.
- `[ ]` **Expected:** Status changes to `payment_pending`.

### Scenario 3.3: Mock Payment
- `[ ]` **Action:** The Organizer clicks "Pay Deposit" (or full amount).
- `[ ]` **Action:** Confirm the mock payment prompt.
- `[ ]` **Expected:** Status changes to `confirmed`. The booking is officially locked in!

---

## 4. Edge Cases & Security Scenarios

- `[ ]` **Unauthenticated Access:** Log out, then try to visit `http://localhost:3000/dashboard` directly.
  - *Expected:* You are immediately redirected to `/sign-in`.
- `[ ]` **Role Restriction:** Log in as an Organizer, then try to visit `http://localhost:3000/earnings` (an Artist route).
  - *Expected:* The UI blocks access or shows an empty/restricted view.
- `[ ]` **Missing Profile Info:** As a new Artist, try to appear in search results without setting your `pricing_min` or `city`.
  - *Expected:* The filters (like max budget) correctly exclude you until you complete your profile.

---

## 5. The Admin Flow (Optional/Phase 1.5)

- `[ ]` **Action:** Create an account and manually set your role to `admin` in Prisma Studio (`npx prisma studio`).
- `[ ]` **Action:** Visit `http://localhost:3000/admin`.
- `[ ]` **Expected:** You can see aggregate stats (total users, total bookings).
