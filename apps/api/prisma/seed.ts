import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This seed creates fake accounts (yasmine.demo@..., djkarim.demo@..., etc.) marked
// is_verified: true with fabricated ratings. Fine for a fresh dev database; a real
// artist landing on a pilot instance seeing "verified" fake competitors is not. There
// is usually no separate staging database for a pilot this size, so the same
// DATABASE_URL that was used for local dev testing can end up being the real one real
// users are in — this guard exists so re-running `npm run db:seed` (or `db:setup`,
// which used to chain it automatically) out of habit can't silently reintroduce demo
// accounts once that's happened. Explicit opt-in only.
if (process.env.SEED_CONFIRM !== 'yes') {
  console.error(
    '\nRefusing to seed: this inserts fake demo accounts (yasmine.demo@..., djkarim.demo@..., ' +
      'etc.) marked as verified.\n' +
      'Only run this against a database with no real users in it.\n' +
      'To proceed: SEED_CONFIRM=yes npm run db:seed\n',
  );
  process.exit(1);
}

async function main() {
  const artists = [
    {
      email: 'yasmine.demo@lime-event.tn',
      clerk_user_id: 'seed_artist_yasmine',
      display_name: 'Yasmine B.',
      city: 'Tunis',
      genres: ['Jazz', 'Soul', 'Live Band'],
      pricing_min: 400,
      pricing_max: 900,
    },
    {
      email: 'djkarim.demo@lime-event.tn',
      clerk_user_id: 'seed_artist_karim',
      display_name: 'DJ Karim',
      city: 'Sousse',
      genres: ['Electronic', 'DJ', 'Club'],
      pricing_min: 300,
      pricing_max: 700,
    },
    {
      email: 'mezwed.demo@lime-event.tn',
      clerk_user_id: 'seed_artist_mezwed',
      display_name: 'Groupe Mezwed Sfax',
      city: 'Sfax',
      genres: ['Traditional', 'Mezwed'],
      pricing_min: 250,
      pricing_max: 600,
    },
  ];

  for (const a of artists) {
    const user = await prisma.user.upsert({
      where: { clerk_user_id: a.clerk_user_id },
      create: {
        email: a.email,
        roles: ['artist'],
        active_role: 'artist',
        clerk_user_id: a.clerk_user_id,
        is_verified: true,
      },
      update: {},
    });

    await prisma.artistProfile.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        display_name: a.display_name,
        bio: `Professional artist based in ${a.city}. Available for weddings and corporate events.`,
        city: a.city,
        genres: a.genres,
        pricing_min: a.pricing_min,
        pricing_max: a.pricing_max,
        avg_rating: 4.5,
      },
      update: {
        display_name: a.display_name,
        city: a.city,
        genres: a.genres,
        pricing_min: a.pricing_min,
        pricing_max: a.pricing_max,
      },
    });
  }

  console.log('Seeded', artists.length, 'demo artists');

  // Seed a demo organizer and a public event
  const orgUser = await prisma.user.upsert({
    where: { clerk_user_id: 'seed_org_ahmed' },
    create: {
      email: 'ahmed.org@lime-event.tn',
      roles: ['organizer'],
      active_role: 'organizer',
      clerk_user_id: 'seed_org_ahmed',
      is_verified: true,
    },
    update: {},
  });

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await prisma.event.create({
    data: {
      organizer_id: orgUser.id,
      title: 'Summer Beach Festival 2026',
      event_type: 'festival',
      city: 'Hammamet',
      event_date: nextMonth,
      budget_min: 500,
      budget_max: 1500,
      style_tags: ['Electronic', 'DJ', 'Live Band'],
      status: 'open',
    }
  });

  console.log('Seeded 1 demo organizer and 1 public event');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
