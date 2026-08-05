What LIME MVP Actually Is (Reframed)
Not a payment platform. Not a contract platform. A professional connection and communication platform.
The value is:

Organiser finds the right artist fast (filters, profiles, transparency)
Artist presents himself professionally (what he brings, what he needs)
Both communicate in a structured way (not WhatsApp chaos)
A clear "offer sheet" replaces verbal negotiation

That's it. Simple. Useful. Launchable.

The New Mental Model
Old ThinkingNew MVP ThinkingEscrow paymentNot our problem yetDigital signatureNot legal in Tunisia anywayCommissionPhase 2Contract PDFReplace with structured "Offer Sheet"Payment status machineRemove entirely from MVP

CURSOR AGENT PROMPT — MVP Simplification: Connection-First Platform

Context
LIME Event MVP is being refocused. The goal is not payments or contracts. The goal is:

Help organisers find and connect with the right artist professionally. Help artists present what they offer and what they need clearly. Replace WhatsApp chaos with structured communication.

Remove or hide everything payment and contract related from the user-facing UI for now. Keep the data models (don't delete them) but remove them from all screens. We are building a professional discovery and communication platform for Phase 1.

Part 1 — Strip the UI (Don't Delete the Code)
1a. Remove from Organiser Booking Flow
In apps/web/src/app/bookings/[id]/page.tsx and any booking-related components:

Remove the payment section entirely from the UI
Remove contract signing UI and PDF preview
Remove any "Sign Contract" button
Remove escrow / payment status displays
Remove commission calculation display
Keep the booking status flow but simplify to:

Request Sent → Artist Responded → Offer Received → Confirmed
Replace this in the booking status stepper:
tsx// OLD
['Request Sent', 'Quote Received', 'Quote Accepted', 'Contract Signed', 'Payment Held', 'Completed']

// NEW
['Request Sent', 'Artist Responded', 'Offer Received', 'Confirmed']
1b. Remove from Artist Dashboard

Remove Earnings page link from sidebar
Remove any payment pending / held / released displays
Remove "Sign contract" prompts
Keep: Bookings, Calendar, Profile, Notifications

1c. Remove from Admin Panel

Remove Payments tab from admin UI for now
Keep: Users, Bookings overview


Part 2 — Enrich Artist Profile (What He Brings + What He Needs)
This is now the core of the platform. The artist profile must clearly communicate two things to organisers: what I provide and what I need from you.
2a. Update Prisma Schema
In prisma/schema.prisma, add to ArtistProfile:
prisma// WHAT THE ARTIST PROVIDES (equipment)
provides_sound_system   Boolean  @default(false)
provides_mixing_desk    Boolean  @default(false) // platine / table de mixage
provides_lighting       Boolean  @default(false) // lumière
provides_microphones    Boolean  @default(false)
provides_instruments    Boolean  @default(false)
provides_stage_backdrop Boolean  @default(false)
provides_own_transport  Boolean  @default(false)
equipment_notes         String?  // free text for anything extra

// WHAT THE ARTIST NEEDS FROM ORGANISER (requirements)
needs_transport         Boolean  @default(false) // transport to/from venue
needs_accommodation     Boolean  @default(false) // hotel if overnight
needs_meals             Boolean  @default(false) // food
needs_drinks            Boolean  @default(false) // beverages on stage
needs_stage_crew        Boolean  @default(false) // staff to help setup
needs_parking           Boolean  @default(false)
needs_dressing_room     Boolean  @default(false)
needs_sound_engineer    Boolean  @default(false) // son engineer from venue
requirements_notes      String?  // anything extra

// PERFORMANCE CAPACITY
min_event_duration_hrs  Float?   // minimum hours they'll perform
max_event_duration_hrs  Float?   // maximum
max_events_per_month    Int?     // how many bookings they accept per month
Run:
bashnpx prisma migrate dev --name artist_provides_and_needs
npx prisma generate

2b. Add Step to Wizard — "What You Bring"
Create apps/web/src/components/lime/wizard/Step4Equipment.tsx:
Replace the old Step 4 (Setup). Rename old Step 4 to Step 5, old Step 5 to Step 6, old Step 6 to Step 7. Add this as the new Step 4.
tsx'use client';
import { useState } from 'react';
import { Field, WizardNav } from './shared';

const PROVIDES_OPTIONS = [
  { key: 'provides_sound_system',   icon: '🔊', label: 'Sound System (PA / Speakers)' },
  { key: 'provides_mixing_desk',    icon: '🎛️', label: 'Mixing Desk / Platine' },
  { key: 'provides_lighting',       icon: '💡', label: 'Lighting Rig' },
  { key: 'provides_microphones',    icon: '🎤', label: 'Microphones' },
  { key: 'provides_instruments',    icon: '🎸', label: 'All Instruments' },
  { key: 'provides_stage_backdrop', icon: '🎭', label: 'Stage Backdrop / Decor' },
  { key: 'provides_own_transport',  icon: '🚐', label: 'Own Transport / Van' },
];

const NEEDS_OPTIONS = [
  { key: 'needs_transport',      icon: '🚗', label: 'Transport to/from Venue' },
  { key: 'needs_accommodation',  icon: '🏨', label: 'Hotel / Accommodation' },
  { key: 'needs_meals',          icon: '🍽️', label: 'Meals' },
  { key: 'needs_drinks',         icon: '💧', label: 'Drinks on Stage' },
  { key: 'needs_stage_crew',     icon: '👷', label: 'Stage Crew / Setup Help' },
  { key: 'needs_parking',        icon: '🅿️', label: 'Parking' },
  { key: 'needs_dressing_room',  icon: '🚪', label: 'Dressing Room' },
  { key: 'needs_sound_engineer', icon: '🎚️', label: 'Sound Engineer from Venue' },
];

export function Step4Equipment({ profile, onNext, onBack, saving }: any) {
  const [form, setForm] = useState({
    // provides
    provides_sound_system:   profile?.provides_sound_system   ?? false,
    provides_mixing_desk:    profile?.provides_mixing_desk    ?? false,
    provides_lighting:       profile?.provides_lighting       ?? false,
    provides_microphones:    profile?.provides_microphones    ?? false,
    provides_instruments:    profile?.provides_instruments    ?? false,
    provides_stage_backdrop: profile?.provides_stage_backdrop ?? false,
    provides_own_transport:  profile?.provides_own_transport  ?? false,
    equipment_notes:         profile?.equipment_notes         ?? '',
    // needs
    needs_transport:         profile?.needs_transport         ?? false,
    needs_accommodation:     profile?.needs_accommodation     ?? false,
    needs_meals:             profile?.needs_meals             ?? false,
    needs_drinks:            profile?.needs_drinks            ?? false,
    needs_stage_crew:        profile?.needs_stage_crew        ?? false,
    needs_parking:           profile?.needs_parking           ?? false,
    needs_dressing_room:     profile?.needs_dressing_room     ?? false,
    needs_sound_engineer:    profile?.needs_sound_engineer    ?? false,
    requirements_notes:      profile?.requirements_notes      ?? '',
  });

  const toggle = (key: string) => {
    setForm(f => ({ ...f, [key]: !f[key as keyof typeof f] }));
  };

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        Equipment & Requirements
      </h2>
      <p style={{ color: '#808080', marginBottom: 32, fontSize: 15 }}>
        Tell organisers exactly what you bring and what you need from them.
        This replaces the back-and-forth questions before every event.
      </p>

      {/* WHAT YOU BRING */}
      <div style={{
        background: '#fafff0', border: '1.5px solid #b7d507',
        borderRadius: 12, padding: 24, marginBottom: 24,
      }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: '#2E2E2E' }}>
          ✅ What I bring to the event
        </h3>
        <p style={{ color: '#808080', fontSize: 13, marginBottom: 16 }}>
          Check everything you arrive with — no surprises for the organiser.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PROVIDES_OPTIONS.map(opt => (
            <label key={opt.key} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: 'pointer', padding: '10px 14px',
              borderRadius: 8, border: '1.5px solid',
              borderColor: form[opt.key as keyof typeof form] ? '#b7d507' : '#e5e5e5',
              background: form[opt.key as keyof typeof form] ? '#f4fbcc' : 'white',
              transition: 'all 150ms ease',
            }}>
              <input
                type="checkbox"
                checked={!!form[opt.key as keyof typeof form]}
                onChange={() => toggle(opt.key)}
                style={{ width: 18, height: 18, accentColor: '#b7d507' }}
              />
              <span style={{ fontSize: 20 }}>{opt.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#2E2E2E' }}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
        <textarea
          value={form.equipment_notes}
          onChange={e => setForm(f => ({ ...f, equipment_notes: e.target.value }))}
          placeholder="Anything else you bring that's not listed above..."
          rows={2}
          style={{
            width: '100%', marginTop: 12, padding: '10px 14px',
            borderRadius: 8, border: '1.5px solid #e5e5e5',
            fontSize: 14, resize: 'vertical', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* WHAT YOU NEED */}
      <div style={{
        background: '#fff8f0', border: '1.5px solid #ffcc80',
        borderRadius: 12, padding: 24, marginBottom: 24,
      }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: '#2E2E2E' }}>
          📋 What I need from the organiser
        </h3>
        <p style={{ color: '#808080', fontSize: 13, marginBottom: 16 }}>
          Check everything the organiser must provide. This becomes part of your offer sheet.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {NEEDS_OPTIONS.map(opt => (
            <label key={opt.key} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: 'pointer', padding: '10px 14px',
              borderRadius: 8, border: '1.5px solid',
              borderColor: form[opt.key as keyof typeof form] ? '#ffaa00' : '#e5e5e5',
              background: form[opt.key as keyof typeof form] ? '#fff8f0' : 'white',
              transition: 'all 150ms ease',
            }}>
              <input
                type="checkbox"
                checked={!!form[opt.key as keyof typeof form]}
                onChange={() => toggle(opt.key)}
                style={{ width: 18, height: 18, accentColor: '#ffaa00' }}
              />
              <span style={{ fontSize: 20 }}>{opt.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#2E2E2E' }}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
        <textarea
          value={form.requirements_notes}
          onChange={e => setForm(f => ({ ...f, requirements_notes: e.target.value }))}
          placeholder="Anything else you need that's not listed above..."
          rows={2}
          style={{
            width: '100%', marginTop: 12, padding: '10px 14px',
            borderRadius: 8, border: '1.5px solid #e5e5e5',
            fontSize: 14, resize: 'vertical', boxSizing: 'border-box',
          }}
        />
      </div>

      <WizardNav onNext={() => onNext(form)} onBack={onBack} saving={saving} />
    </div>
  );
}

Part 3 — Replace Contract with Offer Sheet
Instead of a signed PDF contract, generate a clean Offer Sheet — a read-only structured summary both parties can see and refer to. No signature. No legal claim. Just clarity.
3a. Create the Offer Sheet Component
Create apps/web/src/components/lime/OfferSheet.tsx:
tsxinterface OfferSheetProps {
  booking: any;
  artist: any;
  event: any;
}

export function OfferSheet({ booking, artist, event }: OfferSheetProps) {
  const provides = [
    artist.provides_sound_system   && '🔊 Sound System',
    artist.provides_mixing_desk    && '🎛️ Mixing Desk / Platine',
    artist.provides_lighting       && '💡 Lighting Rig',
    artist.provides_microphones    && '🎤 Microphones',
    artist.provides_instruments    && '🎸 Instruments',
    artist.provides_stage_backdrop && '🎭 Stage Backdrop',
    artist.provides_own_transport  && '🚐 Own Transport',
  ].filter(Boolean);

  const needs = [
    artist.needs_transport      && '🚗 Transport to/from Venue',
    artist.needs_accommodation  && '🏨 Accommodation',
    artist.needs_meals          && '🍽️ Meals',
    artist.needs_drinks         && '💧 Drinks on Stage',
    artist.needs_stage_crew     && '👷 Stage Crew',
    artist.needs_parking        && '🅿️ Parking',
    artist.needs_dressing_room  && '🚪 Dressing Room',
    artist.needs_sound_engineer && '🎚️ Sound Engineer',
  ].filter(Boolean);

  return (
    <div style={{
      background: 'white', borderRadius: 16,
      border: '1.5px solid #e5e5e5',
      padding: 32, maxWidth: 600,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 24,
        paddingBottom: 20, borderBottom: '1px solid #f0f0f0',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            color: '#b7d507', textTransform: 'uppercase', marginBottom: 4 }}>
            LIME Event — Offer Sheet
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#2E2E2E' }}>
            {event.title}
          </h2>
          <p style={{ margin: '4px 0 0', color: '#808080', fontSize: 14 }}>
            {new Date(event.event_date).toLocaleDateString('fr-TN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })} · {event.city}
          </p>
        </div>
        <div style={{
          padding: '6px 14px', borderRadius: 999,
          background: '#f4fbcc', border: '1px solid #b7d507',
          fontSize: 12, fontWeight: 600, color: '#2E2E2E',
        }}>
          {booking.status === 'confirmed' ? '✓ Confirmed' : 'Pending Confirmation'}
        </div>
      </div>

      {/* Parties */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <InfoBlock label="Artist" value={artist.display_name} sub={artist.artist_type === 'band' ? `Band · ${artist.band_size} members` : 'Solo Artist'} />
        <InfoBlock label="Event Type" value={event.event_type} sub={`${event.guest_count ?? '—'} guests`} />
      </div>

      {/* Fee */}
      {booking.agreed_fee && (
        <div style={{
          background: '#f9f9f9', borderRadius: 10,
          padding: '14px 18px', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 14, color: '#808080' }}>Agreed Fee</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#2E2E2E' }}>
            {booking.agreed_fee.toLocaleString()} TND
          </span>
        </div>
      )}

      {/* What artist brings */}
      {provides.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#2E2E2E',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Artist Provides
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {provides.map((item: any) => (
              <span key={item} style={{
                padding: '5px 12px', borderRadius: 999, fontSize: 13,
                background: '#f4fbcc', border: '1px solid #b7d507', color: '#2E2E2E',
              }}>{item}</span>
            ))}
          </div>
          {artist.equipment_notes && (
            <p style={{ fontSize: 13, color: '#808080', marginTop: 8 }}>
              {artist.equipment_notes}
            </p>
          )}
        </div>
      )}

      {/* What organiser must provide */}
      {needs.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#2E2E2E',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Organiser Provides
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {needs.map((item: any) => (
              <span key={item} style={{
                padding: '5px 12px', borderRadius: 999, fontSize: 13,
                background: '#fff8f0', border: '1px solid #ffcc80', color: '#2E2E2E',
              }}>{item}</span>
            ))}
          </div>
          {artist.requirements_notes && (
            <p style={{ fontSize: 13, color: '#808080', marginTop: 8 }}>
              {artist.requirements_notes}
            </p>
          )}
        </div>
      )}

      {/* Duration */}
      {(artist.min_event_duration_hrs || artist.setlist_duration_min) && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: '#2E2E2E',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Performance Duration
          </h4>
          <p style={{ fontSize: 14, color: '#2E2E2E', margin: 0 }}>
            {artist.setlist_duration_min}–{artist.setlist_duration_max} minutes
          </p>
        </div>
      )}

      {/* Footer note */}
      <div style={{
        marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0',
        fontSize: 12, color: '#808080', lineHeight: 1.6,
      }}>
        This offer sheet is generated by LIME Event as a communication reference.
        It is not a legally binding contract. Both parties are responsible for
        confirming details directly before the event.
      </div>
    </div>
  );
}

function InfoBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#808080', textTransform: 'uppercase',
        letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 600, color: '#2E2E2E', fontSize: 15 }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: '#808080' }}>{sub}</div>}
    </div>
  );
}
3b. Replace Contract Page with Offer Sheet
In apps/web/src/app/bookings/[id]/page.tsx:

Remove the contract signing section entirely
Replace with <OfferSheet booking={booking} artist={artist} event={event} />
Add a "Download as PDF" button that uses window.print() for now (no Puppeteer needed in MVP)
Add a "Share via WhatsApp" button:

tsxconst shareOfferSheet = () => {
  const text = encodeURIComponent(
    `Offer Sheet — ${event.title}\n` +
    `Artist: ${artist.display_name}\n` +
    `Date: ${event.event_date}\n` +
    `See full details on LIME Event.`
  );
  window.open(`https://wa.me/?text=${text}`, '_blank');
};

Part 4 — Add Agreed Fee Field to Booking (Replaces Quote Amount)
Rename quote_amount to agreed_fee in the UI (keep the DB column as-is to avoid migration).
In the quote/response flow, when artist sends their offer, the message they send should include:
tsx// In the quote form, rename fields:
// "Price" → "My fee for this event (TND)"
// "Conditions" → "Additional notes"
// Remove: expiry timer, cancellation terms selector

// Simple quote form for MVP:
const [quoteForm, setQuoteForm] = useState({
  agreed_fee: '',
  message: '',
  // auto-populated from profile:
  // provides, needs, duration — pulled from artist profile
});
When the organiser views the quote, show:

Fee amount
What the artist brings (from profile)
What the artist needs (from profile)
Artist's message
Two buttons: "Accept Offer" and "Send Message"

No counter-offer in MVP. Keep it simple: accept or message.

Part 5 — Update the Browse/Filter to Use New Fields
In GET /artists endpoint and browse page, add new filter options:
ts// Backend: apps/api/src/artists/artists.controller.ts
// Add query params:
@Get()
findAll(
  @Query('genre') genre?: string,
  @Query('city') city?: string,
  @Query('artist_type') artist_type?: string,        // 'solo' | 'band'
  @Query('has_sound') has_sound?: string,             // 'true'
  @Query('has_lighting') has_lighting?: string,       // 'true'
  @Query('event_type') event_type?: string,
) { ... }
ts// Service filter additions:
...(artist_type && { artist_type }),
...(has_sound === 'true' && { provides_sound_system: true }),
...(has_lighting === 'true' && { provides_lighting: true }),
Add to browse page filter sidebar:
tsx// New filter section: "Equipment Included"
<FilterSection label="Artist Brings">
  <FilterCheckbox label="🔊 Sound System" value="has_sound" />
  <FilterCheckbox label="💡 Lighting" value="has_lighting" />
  <FilterCheckbox label="🎛️ Mixing Desk" value="has_mixing" />
</FilterSection>

<FilterSection label="Artist Type">
  <FilterRadio label="🎤 Solo" value="solo" />
  <FilterRadio label="🎸 Band / Ensemble" value="band" />
  <FilterRadio label="All" value="" />
</FilterSection>

Part 6 — Update Public Artist Profile Display
In apps/web/src/app/artists/[id]/page.tsx, add a clear "What's Included" section visible to all organisers:
tsx{/* What's Included section — visible on public profile */}
<div style={{ marginTop: 32 }}>
  <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
    What's included
  </h3>

  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
    {/* Brings */}
    <div style={{ background: '#fafff0', border: '1px solid #b7d507',
      borderRadius: 12, padding: 16 }}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: '#2E2E2E' }}>
        ✅ Artist brings
      </div>
      {PROVIDES_OPTIONS.filter(o => profile[o.key]).map(o => (
        <div key={o.key} style={{ fontSize: 13, color: '#2E2E2E',
          marginBottom: 6, display: 'flex', gap: 8 }}>
          <span>{o.icon}</span><span>{o.label}</span>
        </div>
      ))}
      {!PROVIDES_OPTIONS.some(o => profile[o.key]) && (
        <div style={{ fontSize: 13, color: '#808080' }}>
          Artist brings personal instruments only
        </div>
      )}
    </div>

    {/* Needs */}
    <div style={{ background: '#fff8f0', border: '1px solid #ffcc80',
      borderRadius: 12, padding: 16 }}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: '#2E2E2E' }}>
        📋 Organiser must provide
      </div>
      {NEEDS_OPTIONS.filter(o => profile[o.key]).map(o => (
        <div key={o.key} style={{ fontSize: 13, color: '#2E2E2E',
          marginBottom: 6, display: 'flex', gap: 8 }}>
          <span>{o.icon}</span><span>{o.label}</span>
        </div>
      ))}
      {!NEEDS_OPTIONS.some(o => profile[o.key]) && (
        <div style={{ fontSize: 13, color: '#808080' }}>
          No specific requirements
        </div>
      )}
    </div>
  </div>
</div>

Checklist
BACKEND
[ ] Prisma schema: provides_* and needs_* fields added to ArtistProfile
[ ] Migration ran successfully
[ ] UpdateArtistDto updated with all new boolean fields
[ ] GET /artists filter accepts artist_type, has_sound, has_lighting params
[ ] Booking status enum simplified to: pending, responded, offer_received, confirmed
[ ] Payment-related routes kept in backend but not exposed in frontend nav

FRONTEND — PROFILE WIZARD
[ ] Step4Equipment.tsx created with provides + needs checkboxes
[ ] Step numbering updated (Equipment is Step 4, old steps shift +1)
[ ] Equipment step saves all boolean fields correctly
[ ] Notes textarea saves for both provides and needs

FRONTEND — PUBLIC PROFILE
[ ] "What's included" section shows provides + needs on public profile
[ ] Pricing (pricing_min) completely hidden from public view
[ ] No payment or commission info visible anywhere on profile

FRONTEND — BOOKING FLOW
[ ] Contract signing UI removed
[ ] Payment section removed from booking detail
[ ] OfferSheet.tsx component created
[ ] OfferSheet renders on booking detail page after offer accepted
[ ] "Download / Print" button uses window.print()
[ ] "Share via WhatsApp" button works with pre-filled message
[ ] Quote form simplified: fee + message only
[ ] Quote display shows: fee + artist brings + artist needs + message

FRONTEND — BROWSE PAGE
[ ] Filter sidebar has "Artist Type" radio (Solo / Band / All)
[ ] Filter sidebar has "Equipment Included" checkboxes
[ ] Filters call updated GET /artists with correct params

FRONTEND — NAVIGATION
[ ] Earnings removed from artist sidebar
[ ] Payments removed from admin panel nav
[ ] Admin panel shows: Users, Bookings only

TESTING
[ ] Solo artist completes wizard including equipment step — saves correctly
[ ] Band artist completes wizard — band fields + equipment saves correctly
[ ] Organiser browses, filters by "has sound system" — correct results
[ ] Organiser opens artist profile — sees "What's included" section clearly
[ ] Organiser sends booking request → artist responds with fee → organiser accepts
[ ] Offer sheet renders correctly after acceptance
[ ] No payment or contract UI visible anywhere in the flowVous avez dit : i need to aadd a way of negociation between the artist and the orgonizer not a strict way to confirm a contract give me prompt to send it with the last prompt …i need to aadd a way of negociation between the artist and the orgonizer not a strict way to confirm a contract give me prompt to send it with the last prompt together21:05Claude a répondu : CURSOR AGENT PROMPT — Negotiation Thread (Add-on to previous prompt)CURSOR AGENT PROMPT — Negotiation Thread (Add-on to previous prompt)

Context
After an organiser sends a booking request and the artist responds with an offer, both parties need a way to negotiate freely before confirming. This is not a contract flow. It is a structured conversation with a clear end state: Confirmed or Declined. Think WhatsApp thread but professional, with the offer always visible on the side.

What to Build
A Negotiation Thread attached to every booking request. It lives on the booking detail page. Both parties can send messages, update the offer, and finally confirm or decline — all in one place.

Part 1 — Schema Updates
In prisma/schema.prisma, the Message model already exists. Extend it and add a NegotiationOffer model:
prismamodel Message {
  id                 String         @id @default(uuid())
  booking_request_id String
  booking_request    BookingRequest @relation(fields: [booking_request_id], references: [id])
  sender_id          String
  content            String
  message_type       String         @default("text") // "text" | "offer" | "counter" | "system"
  created_at         DateTime       @default(now())
}

model NegotiationOffer {
  id                 String         @id @default(uuid())
  booking_request_id String
  booking_request    BookingRequest @relation(fields: [booking_request_id], references: [id])
  proposed_by        String         // user_id of who sent this offer
  fee                Int            // in TND
  message            String?        // note attached to this offer
  includes_transport Boolean        @default(false)
  includes_meals     Boolean        @default(false)
  includes_accommodation Boolean    @default(false)
  other_conditions   String?
  status             String         @default("pending") // "pending" | "accepted" | "declined" | "superseded"
  created_at         DateTime       @default(now())
}
Add to BookingRequest:
prismanegotiation_messages  Message[]
negotiation_offers    NegotiationOffer[]
agreed_fee            Int?              // set when both confirm
confirmed_at          DateTime?
Run:
bashnpx prisma migrate dev --name add_negotiation
npx prisma generate

Part 2 — Backend Endpoints
Add these endpoints in src/bookings/bookings.controller.ts:
ts// Get full negotiation thread (messages + offers)
GET  /booking-requests/:id/thread

// Send a plain message
POST /booking-requests/:id/messages
Body: { content: string }

// Send or update an offer
POST /booking-requests/:id/offers
Body: { fee: number, message?: string, includes_transport?: boolean,
        includes_meals?: boolean, includes_accommodation?: boolean,
        other_conditions?: string }

// Accept current pending offer
POST /booking-requests/:id/offers/:offerId/accept

// Decline current pending offer
POST /booking-requests/:id/offers/:offerId/decline

// Confirm booking (both happy, no formal offer needed)
POST /booking-requests/:id/confirm
Body: { agreed_fee: number }
In bookings.service.ts:
tsasync getThread(bookingRequestId: string) {
  const messages = await this.prisma.message.findMany({
    where: { booking_request_id: bookingRequestId },
    orderBy: { created_at: 'asc' },
    include: { /* sender info */ },
  });
  const offers = await this.prisma.negotiationOffer.findMany({
    where: { booking_request_id: bookingRequestId },
    orderBy: { created_at: 'asc' },
  });
  // Merge and sort by created_at so offers appear inline in the thread
  return [...messages, ...offers]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

async sendOffer(bookingRequestId: string, userId: string, dto: CreateOfferDto) {
  // Mark all previous pending offers as superseded
  await this.prisma.negotiationOffer.updateMany({
    where: { booking_request_id: bookingRequestId, status: 'pending' },
    data: { status: 'superseded' },
  });
  // Create new offer
  const offer = await this.prisma.negotiationOffer.create({
    data: { booking_request_id: bookingRequestId, proposed_by: userId, ...dto },
  });
  // Auto-post system message in thread
  await this.prisma.message.create({
    data: {
      booking_request_id: bookingRequestId,
      sender_id: userId,
      content: `New offer proposed: ${dto.fee} TND`,
      message_type: 'offer',
    },
  });
  return offer;
}

async acceptOffer(offerId: string, bookingRequestId: string) {
  const offer = await this.prisma.negotiationOffer.update({
    where: { id: offerId },
    data: { status: 'accepted' },
  });
  await this.prisma.bookingRequest.update({
    where: { id: bookingRequestId },
    data: { agreed_fee: offer.fee, status: 'confirmed', confirmed_at: new Date() },
  });
  // System message
  await this.prisma.message.create({
    data: {
      booking_request_id: bookingRequestId,
      sender_id: 'system',
      content: `✅ Offer of ${offer.fee} TND accepted. Booking confirmed.`,
      message_type: 'system',
    },
  });
  return offer;
}

Part 3 — Frontend Negotiation Thread Component
Create apps/web/src/components/lime/NegotiationThread.tsx:
tsx'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

interface Props {
  bookingId: string;
  currentUserId: string;
  currentUserRole: 'artist' | 'organizer';
  bookingStatus: string;
}

export function NegotiationThread({
  bookingId, currentUserId, currentUserRole, bookingStatus
}: Props) {
  const [thread, setThread]         = useState<any[]>([]);
  const [message, setMessage]       = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offer, setOffer]           = useState({
    fee: '', message: '',
    includes_transport: false,
    includes_meals: false,
    includes_accommodation: false,
    other_conditions: '',
  });
  const [sending, setSending]       = useState(false);
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const isConfirmed                 = bookingStatus === 'confirmed';

  useEffect(() => {
    fetchThread();
    // Poll every 10 seconds for new messages (simple real-time for MVP)
    const interval = setInterval(fetchThread, 10000);
    return () => clearInterval(interval);
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  const fetchThread = async () => {
    const res = await api.get(`/booking-requests/${bookingId}/thread`);
    setThread(res.data);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    await api.post(`/booking-requests/${bookingId}/messages`, { content: message });
    setMessage('');
    await fetchThread();
    setSending(false);
  };

  const sendOffer = async () => {
    if (!offer.fee) return;
    setSending(true);
    await api.post(`/booking-requests/${bookingId}/offers`, {
      ...offer,
      fee: parseInt(offer.fee),
    });
    setShowOfferForm(false);
    setOffer({ fee: '', message: '', includes_transport: false,
      includes_meals: false, includes_accommodation: false, other_conditions: '' });
    await fetchThread();
    setSending(false);
  };

  const handleAcceptOffer = async (offerId: string) => {
    await api.post(`/booking-requests/${bookingId}/offers/${offerId}/accept`);
    await fetchThread();
  };

  const handleDeclineOffer = async (offerId: string) => {
    await api.post(`/booking-requests/${bookingId}/offers/${offerId}/decline`);
    await fetchThread();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Confirmed banner */}
      {isConfirmed && (
        <div style={{
          background: '#f4fbcc', border: '1.5px solid #b7d507',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#2E2E2E' }}>
            Booking confirmed — both parties agreed.
          </span>
        </div>
      )}

      {/* Thread messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex',
        flexDirection: 'column', gap: 12, paddingBottom: 16,
        maxHeight: 420,
      }}>
        {thread.length === 0 && (
          <div style={{ textAlign: 'center', color: '#808080',
            fontSize: 14, padding: '40px 0' }}>
            No messages yet. Start the conversation.
          </div>
        )}

        {thread.map((item: any) => {
          // System message
          if (item.message_type === 'system') {
            return (
              <div key={item.id} style={{
                textAlign: 'center', fontSize: 12,
                color: '#808080', padding: '4px 0',
              }}>
                {item.content}
              </div>
            );
          }

          // Offer card
          if (item.message_type === 'offer' && item.fee) {
            const isMyOffer = item.proposed_by === currentUserId;
            const isPending = item.status === 'pending';
            const canRespond = !isMyOffer && isPending && !isConfirmed;

            return (
              <div key={item.id} style={{
                alignSelf: isMyOffer ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}>
                <div style={{
                  background: 'white',
                  border: `2px solid ${isPending ? '#b7d507' : item.status === 'accepted' ? '#b7d507' : '#e5e5e5'}`,
                  borderRadius: 12, padding: 16,
                  opacity: item.status === 'superseded' ? 0.5 : 1,
                }}>
                  {/* Status tag */}
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700,
                      color: '#808080', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {isMyOffer ? 'Your Offer' : 'Offer Received'}
                    </span>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 999,
                      background: item.status === 'accepted' ? '#f4fbcc'
                        : item.status === 'declined' ? '#fff0f0'
                        : item.status === 'superseded' ? '#f5f5f5' : '#fafff0',
                      color: item.status === 'accepted' ? '#2E2E2E'
                        : item.status === 'declined' ? '#cc0000'
                        : '#808080',
                      fontWeight: 600,
                    }}>
                      {item.status === 'superseded' ? 'Replaced' : item.status}
                    </span>
                  </div>

                  {/* Fee */}
                  <div style={{ fontSize: 28, fontWeight: 800,
                    color: '#2E2E2E', marginBottom: 10 }}>
                    {item.fee.toLocaleString()} TND
                  </div>

                  {/* Conditions */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {item.includes_transport && <Tag icon="🚗" label="Transport" />}
                    {item.includes_meals && <Tag icon="🍽️" label="Meals" />}
                    {item.includes_accommodation && <Tag icon="🏨" label="Accommodation" />}
                  </div>

                  {item.other_conditions && (
                    <p style={{ fontSize: 13, color: '#808080', margin: '0 0 10px' }}>
                      {item.other_conditions}
                    </p>
                  )}

                  {item.message && (
                    <p style={{ fontSize: 13, color: '#2E2E2E',
                      fontStyle: 'italic', margin: '0 0 12px' }}>
                      "{item.message}"
                    </p>
                  )}

                  {/* Accept / Decline / Counter */}
                  {canRespond && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleAcceptOffer(item.id)} style={{
                        flex: 1, padding: '9px 14px', borderRadius: 8,
                        background: '#b7d507', border: 'none',
                        fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#2E2E2E',
                      }}>
                        ✓ Accept
                      </button>
                      <button onClick={() => {
                        handleDeclineOffer(item.id);
                        setShowOfferForm(true);
                      }} style={{
                        flex: 1, padding: '9px 14px', borderRadius: 8,
                        background: 'white', border: '1.5px solid #e5e5e5',
                        fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#2E2E2E',
                      }}>
                        ↩ Counter
                      </button>
                      <button onClick={() => handleDeclineOffer(item.id)} style={{
                        padding: '9px 14px', borderRadius: 8,
                        background: 'white', border: '1.5px solid #ffcccc',
                        fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#cc0000',
                      }}>
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#808080', marginTop: 4,
                  textAlign: isMyOffer ? 'right' : 'left' }}>
                  {new Date(item.created_at).toLocaleTimeString('fr-TN', {
                    hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          }

          // Plain message bubble
          const isMe = item.sender_id === currentUserId;
          return (
            <div key={item.id} style={{
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              maxWidth: '75%',
            }}>
              <div style={{
                padding: '10px 14px', borderRadius: 12,
                background: isMe ? '#b7d507' : '#f5f5f5',
                color: '#2E2E2E', fontSize: 14, lineHeight: 1.5,
                borderBottomRightRadius: isMe ? 2 : 12,
                borderBottomLeftRadius: isMe ? 12 : 2,
              }}>
                {item.content}
              </div>
              <div style={{ fontSize: 11, color: '#808080', marginTop: 3,
                textAlign: isMe ? 'right' : 'left' }}>
                {new Date(item.created_at).toLocaleTimeString('fr-TN', {
                  hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Offer form — slides in when needed */}
      {showOfferForm && !isConfirmed && (
        <div style={{
          background: '#fafff0', border: '1.5px solid #b7d507',
          borderRadius: 12, padding: 16, marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              📋 Propose an Offer
            </span>
            <button onClick={() => setShowOfferForm(false)}
              style={{ background: 'none', border: 'none',
                cursor: 'pointer', color: '#808080', fontSize: 18 }}>×</button>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <input
              type="number"
              placeholder="Fee (TND)"
              value={offer.fee}
              onChange={e => setOffer(o => ({ ...o, fee: e.target.value }))}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8,
                border: '1.5px solid #b7d507', fontSize: 16,
                fontWeight: 700, textAlign: 'center' }}
            />
            <span style={{ fontWeight: 700, color: '#808080' }}>TND</span>
          </div>

          {/* Conditions included in this offer */}
          <div style={{ fontSize: 13, fontWeight: 600,
            color: '#808080', marginBottom: 8 }}>
            What's included in this fee:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {[
              { key: 'includes_transport', icon: '🚗', label: 'Transport' },
              { key: 'includes_meals', icon: '🍽️', label: 'Meals' },
              { key: 'includes_accommodation', icon: '🏨', label: 'Accommodation' },
            ].map(c => (
              <button key={c.key} type="button"
                onClick={() => setOffer(o => ({ ...o, [c.key]: !o[c.key as keyof typeof o] }))}
                style={{
                  padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                  border: `1.5px solid ${offer[c.key as keyof typeof offer] ? '#b7d507' : '#e5e5e5'}`,
                  background: offer[c.key as keyof typeof offer] ? '#b7d507' : 'white',
                  fontSize: 13, fontWeight: 500,
                }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          <input
            placeholder="Additional note (optional)"
            value={offer.other_conditions}
            onChange={e => setOffer(o => ({ ...o, other_conditions: e.target.value }))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '1.5px solid #e5e5e5', fontSize: 13,
              marginBottom: 10, boxSizing: 'border-box' }}
          />

          <button onClick={sendOffer} disabled={!offer.fee || sending} style={{
            width: '100%', padding: '11px', borderRadius: 8,
            background: '#b7d507', border: 'none', fontWeight: 700,
            fontSize: 14, cursor: 'pointer', color: '#2E2E2E',
            opacity: offer.fee ? 1 : 0.5,
          }}>
            {sending ? 'Sending...' : 'Send Offer →'}
          </button>
        </div>
      )}

      {/* Input bar — hidden if confirmed */}
      {!isConfirmed && (
        <div style={{ display: 'flex', gap: 8, paddingTop: 12,
          borderTop: '1px solid #f0f0f0' }}>
          <button onClick={() => setShowOfferForm(!showOfferForm)} style={{
            padding: '10px 14px', borderRadius: 8,
            border: '1.5px solid #b7d507', background: 'white',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#b7d507',
            whiteSpace: 'nowrap',
          }}>
            💰 Offer
          </button>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8,
              border: '1.5px solid #e5e5e5', fontSize: 14 }}
          />
          <button onClick={sendMessage} disabled={!message.trim() || sending} style={{
            padding: '10px 18px', borderRadius: 8,
            background: message.trim() ? '#b7d507' : '#f5f5f5',
            border: 'none', cursor: 'pointer', fontWeight: 600,
            fontSize: 13, color: '#2E2E2E',
            transition: 'background 150ms ease',
          }}>
            Send
          </button>
        </div>
      )}
    </div>
  );
}

function Tag({ icon, label }: { icon: string; label: string }) {
  return (
    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12,
      background: '#f4fbcc', border: '1px solid #b7d507', color: '#2E2E2E' }}>
      {icon} {label}
    </span>
  );
}

Part 4 — Wire Into Booking Detail Page
In apps/web/src/app/bookings/[id]/page.tsx, replace the old quote/contract section with a two-column layout:
tsx<div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>

  {/* Left: Offer sheet / event details */}
  <div>
    <OfferSheet booking={booking} artist={artist} event={event} />
  </div>

  {/* Right: Negotiation thread */}
  <div style={{
    background: 'white', borderRadius: 16,
    border: '1px solid #f0f0f0', padding: 24,
    height: 'fit-content', position: 'sticky', top: 24,
  }}>
    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: '#2E2E2E' }}>
      💬 Negotiation
    </h3>
    <NegotiationThread
      bookingId={booking.id}
      currentUserId={currentUser.id}
      currentUserRole={currentUserRole}
      bookingStatus={booking.status}
    />
  </div>

</div>

Checklist
BACKEND
[ ] NegotiationOffer model added to schema
[ ] message_type field added to Message model
[ ] agreed_fee + confirmed_at added to BookingRequest
[ ] Migration ran successfully
[ ] GET /booking-requests/:id/thread returns merged + sorted messages and offers
[ ] POST /booking-requests/:id/messages works
[ ] POST /booking-requests/:id/offers marks previous offers as superseded
[ ] POST /booking-requests/:id/offers/:id/accept updates booking status to confirmed
[ ] POST /booking-requests/:id/offers/:id/decline works
[ ] System message auto-posted on offer sent and offer accepted

FRONTEND
[ ] NegotiationThread.tsx created
[ ] Plain message bubbles render correctly (own = right + green, other = left + gray)
[ ] Offer cards render with fee, conditions tags, status badge
[ ] Accept / Counter / Decline buttons appear only for the receiver of a pending offer
[ ] Counter click declines current offer + opens offer form in one action
[ ] Superseded offers show at 50% opacity
[ ] Offer form slides in/out smoothly
[ ] Confirmed banner appears when status = confirmed
[ ] Input bar hidden when booking is confirmed
[ ] Thread polls every 10 seconds for new messages
[ ] Thread auto-scrolls to bottom on new message
[ ] Booking detail page shows OfferSheet + NegotiationThread side by side
[ ] Mobile: two columns collapse to single column stack