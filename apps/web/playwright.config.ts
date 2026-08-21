import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load the dev-instance Clerk keys the runner needs (clerkSetup + the Backend
// API provisioning in e2e/support/provision.ts). These already live in the
// local env files — no separate .env.test needed. apps/web/.env.local holds
// both the publishable and secret key; fall back to apps/api/.env for the
// secret if a machine only has it there.
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../api/.env') });

const authFile = (name: string) => path.join(__dirname, 'e2e', '.auth', name);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  // Auth-guarded routes bounce through Clerk, so a slow network round trip can
  // push a plain navigation past 30s and make those specs flaky.
  timeout: 60000,
  globalSetup: require.resolve('./e2e/clerk.global.ts'),
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // Signs in each persona once and writes its storageState.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },

    // Existing unauthenticated specs (public pages + redirect-to-sign-in).
    // No storageState, no setup dependency; must not see the authed dirs.
    {
      name: 'public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /e2e\/[^/]+\.spec\.ts$/,
    },

    // Authenticated journeys — each reuses its persona's saved session.
    {
      name: 'organizer',
      use: { ...devices['Desktop Chrome'], storageState: authFile('organizer.json') },
      dependencies: ['setup'],
      testMatch: /e2e\/organizer\/.*\.spec\.ts$/,
    },
    {
      name: 'artist-solo',
      use: { ...devices['Desktop Chrome'], storageState: authFile('artist-solo.json') },
      dependencies: ['setup'],
      testMatch: /e2e\/artist-solo\/.*\.spec\.ts$/,
    },
    {
      name: 'artist-band',
      use: { ...devices['Desktop Chrome'], storageState: authFile('artist-band.json') },
      dependencies: ['setup'],
      testMatch: /e2e\/artist-band\/.*\.spec\.ts$/,
    },
  ],
  /* Start dev servers before running tests if not in CI */
  ...(process.env.CI
    ? {}
    : {
        webServer: [
          {
            command: 'npm run start:dev',
            cwd: '../api',
            url: 'http://localhost:3001/health',
            reuseExistingServer: true,
            timeout: 60000,
          },
          {
            command: 'npm run dev',
            url: 'http://localhost:3000',
            reuseExistingServer: true,
            timeout: 60000,
          },
        ],
      }),
});
