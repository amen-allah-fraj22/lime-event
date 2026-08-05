import { test, expect } from '@playwright/test';

test.describe('Marketplace discovery (public)', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('browse artists shows listing or empty state', async ({ page }) => {
    await page.goto('/artists');
    await expect(page).not.toHaveURL(/sign-in/);
    const cards = page.locator('[data-testid="artist-card"]');
    const empty = page.getByText(/no artists|no results|browse/i);
    await expect(cards.first().or(empty.first())).toBeVisible({ timeout: 15000 });
  });

  test('artist profile link from browse when artists exist', async ({ page }) => {
    await page.goto('/artists');
    const card = page.locator('[data-testid="artist-card"]').first();
    if ((await card.count()) === 0) {
      test.skip();
      return;
    }
    await card.getByRole('link').first().click();
    await expect(page).toHaveURL(/\/artists\//);
  });
});

test.describe('Organizer journey (auth required)', () => {
  test('creating an event requires sign-in', async ({ page }) => {
    await page.goto('/events/new');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('bookings list requires sign-in', async ({ page }) => {
    await page.goto('/dashboard/bookings');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('booking detail requires sign-in', async ({ page }) => {
    await page.goto('/bookings/00000000-0000-0000-0000-000000000000');
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe('Artist journey (auth required)', () => {
  test('dashboard requires sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('notifications require sign-in', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page).toHaveURL(/sign-in/);
  });
});
