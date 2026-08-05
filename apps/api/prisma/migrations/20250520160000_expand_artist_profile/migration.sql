-- Expand ArtistProfile for multi-step wizard (solo/band, matching fields)
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "languages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "profile_photo_url" TEXT;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "cover_photo_url" TEXT;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "artist_type" TEXT NOT NULL DEFAULT 'solo';
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "instruments" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "years_experience" INTEGER;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "performance_style" TEXT;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "band_name" TEXT;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "band_size" INTEGER;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "band_members" JSONB;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "has_sound_system" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "has_lighting" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "setup_time_minutes" INTEGER;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "subgenres" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "performance_types" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "setlist_duration_min" INTEGER;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "setlist_duration_max" INTEGER;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "pricing_notes" TEXT;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "travel_surcharge" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "travel_radius_km" INTEGER;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "demo_track_url" TEXT;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "technical_rider" TEXT;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "hospitality_rider" TEXT;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "is_profile_complete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "profile_completion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- genres may already exist; ensure default
ALTER TABLE "ArtistProfile" ALTER COLUMN "genres" SET DEFAULT ARRAY[]::TEXT[];
