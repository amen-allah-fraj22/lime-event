import { clerkSetup } from '@clerk/testing/playwright';
import { execFileSync } from 'child_process';
import path from 'path';

// Runs once before all specs.
export default async function globalSetup() {
  // Start from a clean slate: remove any e2e test accounts (strictly
  // `+clerk_test` emails) left in the DB by a previous run, so personas are
  // re-provisioned fresh and specs don't inherit a half-finished profile.
  // Reuses the pilot DB behind the e2e marker + teardown (docs/E2E_TESTING_PLAN.md).
  if (process.env.E2E_SKIP_DB_CLEANUP !== '1') {
    const apiDir = path.resolve(__dirname, '../../api');
    try {
      execFileSync('npx', ['ts-node', 'prisma/e2e-cleanup.ts'], {
        cwd: apiDir,
        stdio: 'inherit',
        shell: process.platform === 'win32',
      });
    } catch (err) {
      console.warn('e2e pre-clean skipped (cleanup failed):', (err as Error).message);
    }
  }

  // Mint a Clerk Testing Token from the dev-instance keys so scripted sign-ins
  // bypass bot detection. Env vars it sets are inherited by worker processes.
  await clerkSetup();
}
