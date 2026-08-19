import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Removes e2e test accounts and everything they own. Strictly scoped to emails
// carrying Clerk's synthetic `+clerk_test` marker, so it can only ever touch
// test accounts — never a real user. Safe to run before/after an e2e run; this
// is the teardown docs/E2E_TESTING_PLAN.md refers to (reuse the pilot DB behind
// the e2e marker + teardown).
const TEST_EMAIL_MARKER = 'clerk_test';

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { contains: TEST_EMAIL_MARKER } },
    select: { id: true, email: true },
  });

  if (users.length === 0) {
    console.log('e2e-cleanup: no test accounts found.');
    return;
  }

  const ids = users.map((u) => u.id);

  // Events reference organizer_id; delete them before the owning users. Other
  // relations (artist_profile, booking rows, etc.) cascade from the user row.
  const events = await prisma.event.deleteMany({ where: { organizer_id: { in: ids } } });
  const deleted = await prisma.user.deleteMany({ where: { id: { in: ids } } });

  console.log(
    `e2e-cleanup: removed ${deleted.count} test user(s) and ${events.count} event(s) — ` +
      users.map((u) => u.email).join(', '),
  );
}

main()
  .catch((e) => {
    console.error('e2e-cleanup failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
