import { test, expect } from '@playwright/test';
import {BASE_URL} from "../helper/required-params";

test('has header', async ({ page }) => {
  await page.goto(BASE_URL);

   await expect(page.getByRole('heading', { name: 'Plan generation' })).toBeVisible();
});

