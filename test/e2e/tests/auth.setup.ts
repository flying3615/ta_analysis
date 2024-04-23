import { test as setup } from "@playwright/test";

import { TEST_PASSWORD, TEST_USERNAME } from "../playwright.config";

setup("authenticate", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL(/\/realms\/landonline/, { timeout: 60000 });
  await page.fill('[data-testid="userID"]', TEST_USERNAME);
  await page.fill('[data-testid="password"]', TEST_PASSWORD);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(/\/plan-generation/, { timeout: 40000 });
  await page.waitForSelector('[data-testid="loading-spinner"]', {
    state: "detached",
  });
  await page.context().storageState({ path: "auth/user.json" });
});
