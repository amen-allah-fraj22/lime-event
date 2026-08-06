import { defineConfig, devices } from '@playwright/test';

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
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  /* Start dev server before running tests if not in CI */
  ...(process.env.CI
    ? {}
    : {
        webServer: [
          {
            command: 'npm run start:dev',
            cwd: '../api',
            url: 'http://localhost:3001/health',
            reuseExistingServer: true,
            timeout: 30000,
          },
          {
            command: 'npm run dev',
            url: 'http://localhost:3000',
            reuseExistingServer: true,
            timeout: 30000,
          },
        ],
      }),
});
