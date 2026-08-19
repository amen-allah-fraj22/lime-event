import { test, expect } from '@playwright/test';

// The solo-artist session reaches its own profile/edit flow instead of bouncing
// to sign-in — the counterpart of the organizer smoke, proving the artist
// persona's saved session works.
test('solo artist session resolves to its own profile, not sign-in', async ({ page }) => {
  await page.goto('/artists/me');
  await page.waitForURL(/\/artists\/[^/]+/, { timeout: 30_000 });
  await expect(page).not.toHaveURL(/sign-in/);
});
