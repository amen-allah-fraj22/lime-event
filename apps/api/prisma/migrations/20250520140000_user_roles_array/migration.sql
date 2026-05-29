-- Add multi-role columns
ALTER TABLE "User" ADD COLUMN "roles" TEXT[] NOT NULL DEFAULT ARRAY['organizer']::TEXT[];
ALTER TABLE "User" ADD COLUMN "active_role" TEXT NOT NULL DEFAULT 'organizer';

-- Migrate existing single role into roles array
UPDATE "User" SET "roles" = ARRAY["role"::text], "active_role" = "role"::text;

-- Drop legacy single-role column
ALTER TABLE "User" DROP COLUMN "role";
