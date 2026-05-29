-- CreateEnum
CREATE TYPE "Role" AS ENUM ('artist', 'organizer', 'agency', 'admin');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('wedding', 'corporate', 'festival', 'private', 'club', 'other');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'quoted', 'negotiating', 'accepted', 'contracted', 'completed', 'declined', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('draft', 'pending_organizer', 'pending_artist', 'signed', 'disputed', 'void');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'held', 'released', 'refunded', 'disputed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistProfile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bio" TEXT,
    "genres" TEXT[],
    "city" TEXT,
    "pricing_min" INTEGER,
    "pricing_max" INTEGER,
    "portfolio_links" JSONB,
    "avg_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_bookings" INTEGER NOT NULL DEFAULT 0,
    "agency_id" TEXT,

    CONSTRAINT "ArtistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "event_type" "EventType" NOT NULL,
    "city" TEXT,
    "venue" TEXT,
    "event_date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT,
    "duration_hours" DOUBLE PRECISION,
    "guest_count" INTEGER,
    "budget_min" INTEGER,
    "budget_max" INTEGER,
    "style_tags" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingRequest" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "quote_amount" INTEGER,
    "quote_conditions" JSONB,
    "quote_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "booking_request_id" TEXT NOT NULL,
    "pdf_url" TEXT,
    "organizer_signed_at" TIMESTAMP(3),
    "artist_signed_at" TIMESTAMP(3),
    "organizer_signature" TEXT,
    "artist_signature" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'draft',
    "template_type" TEXT,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "booking_request_id" TEXT NOT NULL,
    "gross_amount" INTEGER NOT NULL,
    "commission_amount" INTEGER NOT NULL,
    "net_amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "payment_intent_id" TEXT,
    "held_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "booking_request_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "booking_request_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "reviewee_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "categories" JSONB,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityBlock" (
    "id" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "is_blocked" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AvailabilityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerk_user_id_key" ON "User"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistProfile_user_id_key" ON "ArtistProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_booking_request_id_key" ON "Contract"("booking_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_booking_request_id_key" ON "Payment"("booking_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_booking_request_id_reviewer_id_key" ON "Rating"("booking_request_id", "reviewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityBlock_artist_id_date_key" ON "AvailabilityBlock"("artist_id", "date");

-- AddForeignKey
ALTER TABLE "ArtistProfile" ADD CONSTRAINT "ArtistProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_booking_request_id_fkey" FOREIGN KEY ("booking_request_id") REFERENCES "BookingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_booking_request_id_fkey" FOREIGN KEY ("booking_request_id") REFERENCES "BookingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_booking_request_id_fkey" FOREIGN KEY ("booking_request_id") REFERENCES "BookingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
