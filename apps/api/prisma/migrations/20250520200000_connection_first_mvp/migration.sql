-- Artist provides / needs
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "provides_sound_system" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "provides_mixing_desk" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "provides_lighting" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "provides_microphones" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "provides_instruments" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "provides_stage_backdrop" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "provides_own_transport" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "equipment_notes" TEXT;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "needs_transport" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "needs_accommodation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "needs_meals" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "needs_drinks" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "needs_stage_crew" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "needs_parking" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "needs_dressing_room" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "needs_sound_engineer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "requirements_notes" TEXT;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "min_event_duration_hrs" DOUBLE PRECISION;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "max_event_duration_hrs" DOUBLE PRECISION;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "max_events_per_month" INTEGER;

UPDATE "ArtistProfile" SET "provides_sound_system" = true WHERE "has_sound_system" = true;
UPDATE "ArtistProfile" SET "provides_lighting" = true WHERE "has_lighting" = true;

-- Booking negotiation
ALTER TABLE "BookingRequest" ADD COLUMN IF NOT EXISTS "agreed_fee" INTEGER;
ALTER TABLE "BookingRequest" ADD COLUMN IF NOT EXISTS "confirmed_at" TIMESTAMPTZ;

ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "message_type" TEXT NOT NULL DEFAULT 'text';

CREATE TABLE IF NOT EXISTS "NegotiationOffer" (
  "id" TEXT NOT NULL,
  "booking_request_id" TEXT NOT NULL,
  "proposed_by" TEXT NOT NULL,
  "fee" INTEGER NOT NULL,
  "message" TEXT,
  "includes_transport" BOOLEAN NOT NULL DEFAULT false,
  "includes_meals" BOOLEAN NOT NULL DEFAULT false,
  "includes_accommodation" BOOLEAN NOT NULL DEFAULT false,
  "other_conditions" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NegotiationOffer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NegotiationOffer_booking_request_id_fkey" FOREIGN KEY ("booking_request_id") REFERENCES "BookingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "NegotiationOffer_booking_request_id_idx" ON "NegotiationOffer"("booking_request_id");
