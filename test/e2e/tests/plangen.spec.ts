import { expect, test } from "@playwright/test";

import { APP_URL, TEST_PASSWORD, TEST_USERNAME } from "../playwright.config";

test.describe("plangen", () => {
  test.setTimeout(60000);
  test("has header", async ({ page }) => {
    // TODO: Mock the api call before navigating as currently app is not redirecting to diagram page after entering login credential
    await page.route("**/v1/my-accesses", async (route) => {
      const responseMock = {
        id: "extsurv1",
        loginType: "EXTN",
        roles: ["CATEGORY_EXSU", "CATEGORY_SPIL"],
        profiles: ["PROFILE_EXTERNAL_SURVEY_USER"],
        firms: [
          {
            id: "firm4",
            name: "Firm 4",
            privileges: [
              "PRV_CREATE_SURVEY",
              "PRV_PRE_VALIDATE",
              "PRV_SURVEY_SIGN_SUBMIT",
              "PRV_VIEW_SURVEY",
            ],
          },
        ],
      };
      await route.fulfill({ status: 200, json: responseMock });
    });

    await page.goto(APP_URL);
    await page.waitForURL(/\/realms\/landonline/, { timeout: 40000 });
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
