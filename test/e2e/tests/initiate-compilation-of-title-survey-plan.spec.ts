import { expect, test } from "@playwright/test";

test.describe("Layout Plan Sheets", () => {
  test("Initiate compilation of title and survey plan documents", async ({ page }) => {
    test.setTimeout(120000);
    const transactionId = 5000061;

    await page.goto(`/plan-generation/${transactionId}/layout-plan-sheets`);
    await expect(page.getByRole("heading", { name: "Title sheet diagrams" })).toBeVisible({ timeout: 120000 });

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith(`/generate-plans/${transactionId}/pre-compile-plans`) && response.status() === 200,
        { timeout: 60000 },
      ),
      page.waitForResponse(
        (response) =>
          response.url().endsWith(`/generate-plans/${transactionId}/compile-plans`) && response.status() === 200,
        { timeout: 120000 },
      ),
      expect(page.getByText("Plan generation has been initiated successfully.")).toBeVisible(),
      page.getByRole("button", { name: "Compile plan(s)" }).click(),
    ]);
  });
});
