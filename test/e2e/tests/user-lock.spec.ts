import { expect, test } from "@playwright/test";

test.describe("User Locking", () => {
  test("Check user is shown a modal message when the survey is locked by another user", async ({ page }) => {
    //Set a timeout for page events (e.g. click), otherwise it defaults to the test timeout, which is currently set to 180 sec for local
    page.setDefaultTimeout(30000);
    const surveyNumber = "5000061";
    await page.goto(`plan-generation/${surveyNumber}/define-diagrams`);
    await expect(page.locator("body", { hasText: "This CSD is being used by extsurv4." })).toBeVisible();
  });
});
