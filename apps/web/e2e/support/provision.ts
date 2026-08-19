// Idempotent Clerk Backend API helpers for e2e users. Uses the dev-instance
// secret key (loaded in playwright.config.ts) to create verified test accounts
// with a known password, so Playwright can sign them in without the email-code
// UI. Admin-created users have their email pre-verified, so no inbox is needed.

import type { Persona } from './personas';

const CLERK_API = 'https://api.clerk.com/v1';

function secretKey(): string {
  const sk = process.env.CLERK_SECRET_KEY;
  if (!sk) {
    throw new Error(
      'CLERK_SECRET_KEY is not set for the e2e run. It should load from ' +
        'apps/web/.env.local (or apps/api/.env) via playwright.config.ts.',
    );
  }
  return sk;
}

async function clerkFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${CLERK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

/** Returns the Clerk user id for an email, or null if none exists. */
async function findUserIdByEmail(email: string): Promise<string | null> {
  const res = await clerkFetch(
    `/users?email_address=${encodeURIComponent(email)}&limit=1`,
  );
  if (!res.ok) {
    throw new Error(`Clerk list users failed (${res.status}): ${await res.text()}`);
  }
  const users = (await res.json()) as { id: string }[];
  return users.length ? users[0].id : null;
}

/**
 * Ensure a Clerk user exists for this persona with the known password and a
 * verified email. Idempotent: creates on first run, and on later runs resets
 * the password so sign-in stays deterministic even if a prior run changed it.
 * Returns the Clerk user id.
 */
export async function ensureClerkUser(persona: Persona): Promise<string> {
  const existing = await findUserIdByEmail(persona.email);
  if (existing) {
    // Keep the password deterministic across runs.
    const res = await clerkFetch(`/users/${existing}`, {
      method: 'PATCH',
      body: JSON.stringify({ password: persona.password, skip_password_checks: true }),
    });
    if (!res.ok) {
      throw new Error(`Clerk update user failed (${res.status}): ${await res.text()}`);
    }
    return existing;
  }

  // This instance requires a username. Derive a stable, unique one from the
  // email local-part (e.g. "e2e_organizer+clerk_test@…" → "e2e_organizer").
  const username = persona.email.split('+')[0];
  const res = await clerkFetch('/users', {
    method: 'POST',
    body: JSON.stringify({
      email_address: [persona.email],
      username,
      password: persona.password,
      skip_password_checks: true,
      skip_password_requirement: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`Clerk create user failed (${res.status}): ${await res.text()}`);
  }
  const user = (await res.json()) as { id: string };
  return user.id;
}

export async function ensureAllClerkUsers(personas: Persona[]): Promise<void> {
  for (const p of personas) {
    await ensureClerkUser(p);
  }
}

/**
 * Mint a one-time sign-in token for a user. Used with the `ticket` sign-in
 * strategy, which completes directly — bypassing any second-factor requirement
 * the instance enforces (password sign-in returns `needs_second_factor` and
 * can't complete headlessly). This is Clerk's supported path for programmatic
 * test sign-in.
 */
export async function createSignInToken(clerkUserId: string): Promise<string> {
  const res = await clerkFetch('/sign_in_tokens', {
    method: 'POST',
    body: JSON.stringify({ user_id: clerkUserId }),
  });
  if (!res.ok) {
    throw new Error(`Clerk create sign-in token failed (${res.status}): ${await res.text()}`);
  }
  const body = (await res.json()) as { token: string };
  return body.token;
}
