import { test, expect } from '@playwright/test';

test('has header', async ({ page }) => {
  await page.goto('https://kumara.env.landonline.govt.nz/plan-generation/');

// Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Plan generation' })).toBeVisible();
});

