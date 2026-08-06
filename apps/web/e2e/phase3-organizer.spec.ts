import { test, expect } from '@playwright/test';

test.describe('Phase 3 - Organizer Experience', () => {

  test('Create Event page requires authentication', async ({ page }) => {
    // Attempting to visit /events/create without being logged in should redirect
    await page.goto('/events/create');
    await expect(page).toHaveURL(/.*sign-in.*/);
  });

  test('Explore Artists page is accessible publicly and shows filters', async ({ page }) => {
    await page.goto('/explore/artists');
    
    // Check if the page loaded
    await expect(page.locator('h1')).toContainText('Browse artists', { ignoreCase: true });

    // Check mobile filter toggle exists (hidden on desktop, but present in DOM).
    // Targeted by test id so the assertion survives copy changes — it was
    // previously matched on the literal text "Toggle Filters", which the UI
    // no longer uses.
    const toggleButton = page.getByTestId('mobile-filter-toggle');
    await expect(toggleButton).toBeAttached();

    // Side filter panel should be present
    const filterPanel = page.locator('h2', { hasText: 'Filters' });
    await expect(filterPanel).toBeAttached();
  });

  test('Event matches page requires authentication', async ({ page }) => {
    await page.goto('/events/fake-id/matches');
    await expect(page).toHaveURL(/.*sign-in.*/);
  });
});
