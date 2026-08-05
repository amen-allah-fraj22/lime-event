import { test, expect } from '@playwright/test';

test.describe('Phase 1 - Mobile First Navigation & Routing', () => {
  // We use mobile viewport to test the mobile bottom nav
  test.use({ viewport: { width: 375, height: 812 } });

  test('Public routes should not redirect to sign-in', async ({ page }) => {
    // Landing page
    await page.goto('/');
    await expect(page).toHaveURL('/');
    
    // Explore Artists (public)
    await page.goto('/explore/artists');
    await expect(page).toHaveURL('/explore/artists');

    // Explore Events (public)
    await page.goto('/explore/events');
    await expect(page).toHaveURL('/explore/events');
  });

  test('Private new role-based routes should redirect to sign-in', async ({ page }) => {
    // Agenda (Artist Home)
    await page.goto('/agenda');
    await expect(page).toHaveURL(/.*\/sign-in.*/);

    // Requests (Both Roles)
    await page.goto('/requests');
    await expect(page).toHaveURL(/.*\/sign-in.*/);

    // Messages (Both Roles)
    await page.goto('/messages');
    await expect(page).toHaveURL(/.*\/sign-in.*/);

    // Profile (Both Roles)
    await page.goto('/profile');
    await expect(page).toHaveURL(/.*\/sign-in.*/);
  });

  test('Old dashboard route redirects properly', async ({ page }) => {
    await page.goto('/dashboard');
    // Without auth, middleware intercepts /dashboard first
    await expect(page).toHaveURL(/.*\/sign-in.*/);
  });
});
