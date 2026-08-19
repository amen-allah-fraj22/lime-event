import { test, expect } from '@playwright/test';

// The band journey the manual testing never covered: a band enters its member
// count and a per-member line-up in the onboarding wizard (the fields wired into
// SimplifiedStep2Sound), publishes, and the line-up round-trips to the public
// profile. Runs as the artist-band persona (its saved session).
test('band can enter a line-up in the wizard and it shows on the public profile', async ({
  page,
}) => {
  // /artists/me resolves the signed-in artist's own profile and (since it's
  // still incomplete) redirects into the edit wizard.
  await page.goto('/artists/me');
  await page.waitForURL(/\/artists\/[^/]+\/edit/, { timeout: 30_000 });
  const editUrl = new URL(page.url());
  const profileId = editUrl.pathname.split('/')[2];
  expect(profileId).toBeTruthy();

  // Step 1 — identity. The wizard's labels aren't associated with their inputs,
  // so target by attribute/role: the name is the only required text field.
  await page.locator('input[required]').first().fill('E2E Test Band');
  await page.getByRole('button', { name: /Next: Sound/ }).click();

  // Step 2 — sound: ensure Band is selected (deterministic whether or not the
  // profile already had a type), then the band-only fields appear.
  const bandRadio = page.getByRole('radio', { name: 'Band / Group' });
  if (!(await bandRadio.isChecked())) {
    await page.getByText('Band / Group', { exact: true }).click();
  }
  const memberCount = page.getByRole('spinbutton');
  await memberCount.waitFor({ state: 'visible', timeout: 15_000 });
  await memberCount.fill('3');

  // Add two line-up rows (name / role / instrument)
  const addMember = page.getByRole('button', { name: '+ Add member' });
  await addMember.click();
  await addMember.click();

  const names = page.getByPlaceholder('Name');
  const roles = page.getByPlaceholder(/Role/);
  const instruments = page.getByPlaceholder('Instrument');

  await names.nth(0).fill('Amira');
  await roles.nth(0).fill('lead singer');
  await instruments.nth(0).fill('Vocals');

  await names.nth(1).fill('Youssef');
  await roles.nth(1).fill('guitarist');
  await instruments.nth(1).fill('Guitar');

  await page.getByRole('button', { name: /Next: Portfolio/ }).click();

  // Step 3 — portfolio (demo link optional)
  await page.getByRole('button', { name: /Next: Requirements/ }).click();

  // Step 4 — requirements → publish. Publish redirects to the public profile.
  await page.getByRole('button', { name: /Publish Profile/ }).click();
  await page.waitForURL(new RegExp(`/artists/${profileId}(?!/edit)`), { timeout: 30_000 });

  // The public profile shows the line-up we just entered.
  await expect(page.getByRole('heading', { name: 'Band members' })).toBeVisible();
  await expect(page.getByText('Amira')).toBeVisible();
  await expect(page.getByText('Youssef')).toBeVisible();
  await expect(page.getByText(/3 members/)).toBeVisible();
});
