import { test, expect } from '@playwright/test';

test.describe('Health & Smoke Tests', () => {
  test('Landing page loads', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    // The page should contain the LIME brand somewhere
    await expect(page.locator('body')).toBeVisible();
  });

  test('Sign-in page renders', async ({ page }) => {
    await page.goto('/sign-in');
    // Clerk renders its sign-in component
    await expect(page.locator('body')).toBeVisible();
    // Page should not be a raw error
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('Sign-up page renders', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('Browse artists page loads (public route)', async ({ page }) => {
    const response = await page.goto('/artists');
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
  });
});
