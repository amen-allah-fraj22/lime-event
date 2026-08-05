-- Optional venue/place photo on Event, uploaded by the organizer
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "venue_photo_url" TEXT;
