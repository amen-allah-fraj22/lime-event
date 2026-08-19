import { test, expect } from '@playwright/test';

// Proves the whole authenticated harness works end to end: the organizer
// persona's saved session lands on the real dashboard instead of bouncing to
// /sign-in (which is all the unauthenticated suite could ever check).
test('organizer session reaches the dashboard, not sign-in', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page).not.toHaveURL(/sign-in/);
});
