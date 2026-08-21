import { test as setup, expect, type Page } from '@playwright/test';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import fs from 'fs';
import path from 'path';
import { ALL_PERSONAS, type Persona } from './support/personas';
import { createSignInToken, ensureClerkUser } from './support/provision';

const authDir = path.join(__dirname, '.auth');

/**
 * Drive /onboarding/role to the exact target role set, then continue. The page
 * renders a summary <li> per selected role ("Artist:", "Organizer:", …), which
 * we use as the source of truth for what's currently selected — clicking chips
 * until the selection matches, so this is deterministic regardless of any role
 * metadata a previous run left on the account.
 */
async function selectRoles(page: Page, roles: Persona['roles']) {
  const wanted = new Set<string>(roles.map((r) => r[0].toUpperCase() + r.slice(1)));
  const all = ['Artist', 'Organizer', 'Agency'];

  const isSelected = async (label: string) =>
    (await page.getByRole('listitem').filter({ hasText: `${label}:` }).count()) > 0;

  for (const label of all) {
    const shouldBe = wanted.has(label);
    const currently = await isSelected(label);
    if (shouldBe !== currently) {
      await page.getByRole('button', { name: label, exact: true }).click();
    }
  }

  // Confirm final state before continuing.
  for (const label of all) {
    expect(await isSelected(label)).toBe(wanted.has(label));
  }
}

async function authenticate(page: Page, persona: Persona) {
  const clerkUserId = await ensureClerkUser(persona);
  // Admin-minted ticket → sign-in completes directly, bypassing the instance's
  // second-factor requirement (plain password sign-in returns
  // needs_second_factor and can't complete headlessly).
  const ticket = await createSignInToken(clerkUserId);

  // Clerk must be FULLY loaded before signIn — the helper silently no-ops if
  // window.Clerk.client isn't ready yet (`if(!Clerk.client) return`), leaving
  // the session signed-out with no error. So wait for Clerk.loaded === true,
  // not merely for window.Clerk to exist. The dev server can cold-compile the
  // route on first hit, so give it room.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => (window as { Clerk?: { loaded?: boolean } }).Clerk?.loaded === true,
    null,
    { timeout: 120_000 },
  );
  await setupClerkTestingToken({ page });
  await clerk.signIn({ page, signInParams: { strategy: 'ticket', ticket } });

  // Confirm the session is actually active (cookie written) before hitting a
  // protected route — otherwise clerkMiddleware's auth.protect() bounces the
  // navigation straight back to /sign-in.
  await page.waitForFunction(
    () => Boolean((window as { Clerk?: { user?: unknown } }).Clerk?.user),
    null,
    { timeout: 30_000 },
  );

  // Real onboarding path: sets unsafeMetadata.role and creates the Postgres row
  // via POST /auth/sync, exactly as a real user's first session does.
  await page.goto('/onboarding/role');
  await page.waitForURL('**/onboarding/role', { timeout: 30_000 });
  await selectRoles(page, persona.roles);

  // /auth/sync occasionally 503s when the Supabase pooler hiccups (a known
  // intermittent flagged in the pre-launch plan). Retry the continue a few
  // times rather than failing the whole run on a transient infra blip.
  const continueBtn = page.getByRole('button', { name: 'Continue to dashboard' });
  for (let attempt = 1; ; attempt++) {
    await continueBtn.click();
    try {
      await page.waitForURL('**/dashboard', { timeout: 15_000 });
      break;
    } catch (err) {
      if (attempt >= 4) throw err;
      await page.waitForTimeout(2_000);
    }
  }

  fs.mkdirSync(authDir, { recursive: true });
  await page.context().storageState({ path: path.join(__dirname, persona.storageState) });
}

for (const persona of ALL_PERSONAS) {
  setup(`authenticate ${persona.key}`, async ({ page }) => {
    // Generous budget: a cold dev-server compile of the auth + onboarding routes
    // on the first persona can be slow. Later personas run warm.
    setup.setTimeout(180_000);
    await authenticate(page, persona);
  });
}
