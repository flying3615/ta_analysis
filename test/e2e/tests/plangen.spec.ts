import { expect, test } from "@playwright/test";

import { APP_URL, TEST_PASSWORD, TEST_USERNAME } from "../playwright.config";

test.describe("plangen", () => {
  test.setTimeout(120000);
  test("has header", async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForURL(/\/realms\/landonline/, { timeout: 60000 });
    await page.fill('[data-testid="userID"]', TEST_USERNAME, {
      timeout: 30000,
    });
    await page.fill('[data-testid="password"]', TEST_PASSWORD);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/\/plan-generation/, { timeout: 40000 });
    await page.waitForSelector('[data-testid="loading-spinner"]', {
      state: "detached",
    });
    await expect(
      page.getByRole("heading", { name: "Plan generation" }),
    ).toBeVisible();
  });
});
