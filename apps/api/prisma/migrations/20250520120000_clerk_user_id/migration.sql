-- Rename Supabase auth column to Clerk (skip if fresh install already has clerk_user_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'supabase_auth_id'
  ) THEN
    ALTER TABLE "User" RENAME COLUMN "supabase_auth_id" TO "clerk_user_id";
  END IF;
END $$;
