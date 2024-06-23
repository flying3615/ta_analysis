import { expect, test } from "@playwright/test";

test.describe("plangen", () => {
  test("has header", async ({ page }) => {
    await page.goto("plan-generation/5000050");
    await expect(page.getByRole("heading", { name: "Plan generation" })).toBeVisible();
  });
});
