import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
