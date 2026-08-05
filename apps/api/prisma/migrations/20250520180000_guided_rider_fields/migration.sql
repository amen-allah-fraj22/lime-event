-- Guided rider fields: travel options + rider arrays

ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "travel_options" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "travel_other" TEXT;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "technical_other" TEXT;
ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "hospitality_other" TEXT;

ALTER TABLE "ArtistProfile"
  ALTER COLUMN "technical_rider" TYPE TEXT[]
  USING CASE
    WHEN "technical_rider" IS NULL OR trim("technical_rider") = '' THEN ARRAY[]::TEXT[]
    ELSE ARRAY[trim("technical_rider")]
  END;

ALTER TABLE "ArtistProfile"
  ALTER COLUMN "hospitality_rider" TYPE TEXT[]
  USING CASE
    WHEN "hospitality_rider" IS NULL OR trim("hospitality_rider") = '' THEN ARRAY[]::TEXT[]
    ELSE ARRAY[trim("hospitality_rider")]
  END;

ALTER TABLE "ArtistProfile" ALTER COLUMN "technical_rider" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ArtistProfile" ALTER COLUMN "hospitality_rider" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ArtistProfile" ALTER COLUMN "technical_rider" SET NOT NULL;
ALTER TABLE "ArtistProfile" ALTER COLUMN "hospitality_rider" SET NOT NULL;
