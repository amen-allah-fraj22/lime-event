// Synthetic e2e personas. These are NOT real people — they're `+clerk_test`
// accounts on the Clerk *dev* instance, created/torn down by the suite. All
// share the `e2e_` marker in their clerk_user_id-linked email so the DB
// teardown can find and remove exactly them (see support/provision.ts) and
// never touch a real account, per docs/E2E_TESTING_PLAN.md.

export type PersonaKey = 'organizer' | 'artistSolo' | 'artistBand';

export interface Persona {
  key: PersonaKey;
  email: string;
  password: string;
  roles: ('organizer' | 'artist')[];
  /** storageState file, relative to the e2e dir */
  storageState: string;
}

// One fixed password for all e2e users. Uncommon enough to pass Clerk's
// breach/policy checks; only ever used against the dev instance.
const E2E_PASSWORD = 'E2e!Lime$Test_2026';

export const PERSONAS: Record<PersonaKey, Persona> = {
  organizer: {
    key: 'organizer',
    email: 'e2e_organizer+clerk_test@example.com',
    password: E2E_PASSWORD,
    roles: ['organizer'],
    storageState: '.auth/organizer.json',
  },
  artistSolo: {
    key: 'artistSolo',
    email: 'e2e_artist_solo+clerk_test@example.com',
    password: E2E_PASSWORD,
    roles: ['artist'],
    storageState: '.auth/artist-solo.json',
  },
  artistBand: {
    key: 'artistBand',
    email: 'e2e_artist_band+clerk_test@example.com',
    password: E2E_PASSWORD,
    roles: ['artist'],
    storageState: '.auth/artist-band.json',
  },
};

export const ALL_PERSONAS = Object.values(PERSONAS);
