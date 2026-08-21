import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Removes exactly the records prisma/seed.ts creates, and nothing else — targeted by
// the same unique clerk_user_id values the seed script upserts on, not a heuristic
// match on email/name, so this can't accidentally catch a real user.
//
// Not wired into any npm script and not run automatically anywhere. Review this file,
// then run explicitly when ready:
//   REMOVE_CONFIRM=yes npx ts-node prisma/remove-seed-data.ts
const SEED_CLERK_USER_IDS = [
  'seed_artist_yasmine',
  'seed_artist_karim',
  'seed_artist_mezwed',
  'seed_org_ahmed',
];

async function main() {
  if (process.env.REMOVE_CONFIRM !== 'yes') {
    console.error(
      '\nRefusing to run: this permanently deletes the demo accounts created by ' +
        'prisma/seed.ts and the event they created.\n' +
        'Review this file first, then: REMOVE_CONFIRM=yes npx ts-node prisma/remove-seed-data.ts\n',
    );
    process.exit(1);
  }

  const users = await prisma.user.findMany({
    where: { clerk_user_id: { in: SEED_CLERK_USER_IDS } },
    select: { id: true, email: true, clerk_user_id: true },
  });

  if (users.length === 0) {
    console.log('No seed accounts found — nothing to remove.');
    return;
  }

  console.log('Found seed accounts:', users.map((u) => u.email).join(', '));
  const userIds = users.map((u) => u.id);

  // Delete the demo event(s) created by the seed organizer first (events reference
  // organizer_id), then the accounts themselves. Prisma's relation config on other
  // tables (artist_profile, etc.) already cascades from the user row.
  const deletedEvents = await prisma.event.deleteMany({
    where: { organizer_id: { in: userIds } },
  });
  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });

  console.log(`Removed ${deletedEvents.count} event(s) and ${deletedUsers.count} user(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
