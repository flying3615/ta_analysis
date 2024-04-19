import { Page } from "@playwright/test";

import { APP_URL, TEST_PASSWORD, TEST_USERNAME } from "./required-params";
export const loginGui = async (
  page: Page,
  _url = `${APP_URL}`,
): Promise<void> => {
  // Go to url
  await page.goto(_url);

  await page.fill('[data-testid="userID"]', TEST_USERNAME);

  await page.fill('[data-testid="password"]', TEST_PASSWORD);

  await page.click('[data-testid="login-button"]');
  await page.waitForURL(/\/plan-generation/, { timeout: 30000 });
  // await page.waitForSelector('[data-testid="loading-spinner"]', {
  //   state: "detached",
  // });
};
