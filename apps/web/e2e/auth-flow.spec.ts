import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('Protected route /dashboard redirects to sign-in', async ({ page }) => {
    const response = await page.goto('/dashboard');
    // Clerk middleware redirects unauthenticated users
    const url = page.url();
    expect(url).toContain('/sign-in');
  });

  test('Protected route /events/new redirects to sign-in', async ({ page }) => {
    await page.goto('/events/new');
    const url = page.url();
    expect(url).toContain('/sign-in');
  });

  test('Protected route /calendar redirects to sign-in', async ({ page }) => {
    await page.goto('/calendar');
    const url = page.url();
    expect(url).toContain('/sign-in');
  });

  test('Protected route /notifications redirects to sign-in', async ({ page }) => {
    await page.goto('/notifications');
    const url = page.url();
    expect(url).toContain('/sign-in');
  });

  test('Protected route /admin redirects to sign-in', async ({ page }) => {
    await page.goto('/admin');
    const url = page.url();
    expect(url).toContain('/sign-in');
  });

  test('Public route / does NOT redirect', async ({ page }) => {
    await page.goto('/');
    const url = page.url();
    expect(url).not.toContain('/sign-in');
  });

  test('Public route /artists does NOT redirect', async ({ page }) => {
    await page.goto('/artists');
    const url = page.url();
    expect(url).not.toContain('/sign-in');
  });
});
