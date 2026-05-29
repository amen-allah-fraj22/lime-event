-- Run in Supabase SQL editor after Prisma migrate (table names match Prisma defaults)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ArtistProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookingRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contract" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read artist profiles"
  ON "ArtistProfile" FOR SELECT USING (true);

CREATE POLICY "Owner update artist profile"
  ON "ArtistProfile" FOR UPDATE
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Own notifications only"
  ON "Notification" FOR SELECT
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Booking request participants"
  ON "BookingRequest" FOR SELECT
  USING (
    organizer_id::text = auth.uid()::text OR
    artist_id::text = auth.uid()::text
  );
