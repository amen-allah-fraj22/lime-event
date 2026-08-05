import { PrismaClient } from '@prisma/client';

const id = process.argv[2];
if (!id) {
  console.error('Usage: ts-node scripts/check-booking.ts <booking-id>');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const booking = await prisma.bookingRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      organizer_id: true,
      artist_id: true,
      event: { select: { title: true } },
      organizer: { select: { email: true } },
      artist: { select: { email: true } },
    },
  });
  console.log(JSON.stringify(booking, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
