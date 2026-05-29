import type { UserResource } from '@clerk/types';
import { ensureDatabaseUser } from './auth-sync';

type MePayload = Awaited<ReturnType<typeof ensureDatabaseUser>>;

let cached: { clerkId: string; data: MePayload; at: number } | null = null;
let inflight: Promise<MePayload> | null = null;
let inflightClerkId: string | null = null;

const TTL_MS = 60_000;

export function invalidateMeCache() {
  cached = null;
  inflight = null;
  inflightClerkId = null;
}

export async function fetchMeCached(
  clerkUser: UserResource,
  getToken: () => Promise<string | null>,
  options?: { force?: boolean },
): Promise<MePayload> {
  const clerkId = clerkUser.id;
  const force = options?.force ?? false;

  if (
    !force &&
    cached &&
    cached.clerkId === clerkId &&
    Date.now() - cached.at < TTL_MS
  ) {
    return cached.data;
  }

  if (!force && inflight && inflightClerkId === clerkId) {
    return inflight;
  }

  inflightClerkId = clerkId;
  inflight = ensureDatabaseUser(clerkUser, getToken)
    .then((data) => {
      cached = { clerkId, data, at: Date.now() };
      return data;
    })
    .finally(() => {
      inflight = null;
      inflightClerkId = null;
    });

  return inflight;
}
