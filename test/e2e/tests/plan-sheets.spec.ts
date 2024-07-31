import { expect, test } from "@playwright/test";
import { PlanSheetsPage } from "pages/PlanSheetsPage";

test.describe("Layout Plan Sheets", () => {
  test("Save layout in title sheet diagram", async ({ page, baseURL }) => {
    const planSheetsPage = new PlanSheetsPage(page, baseURL);

    await page.goto("/plan-generation/layout-plan-sheets/5000056");
    await expect(page.getByRole("heading", { name: "Title sheet diagrams" })).toBeVisible({ timeout: 180000 });

    const { position: cytoscapeNodePosition } = (await planSheetsPage.fetchCytoscapeData()).getCytoscapeNode(2);

    // Move a mark to trigger a layout change
    await page.hover("canvas", {
      position: {
        x: cytoscapeNodePosition.x,
        y: cytoscapeNodePosition.y,
      },
      force: true,
    });
    await page.mouse.down();
    await page.hover("canvas", {
      position: {
        x: cytoscapeNodePosition.x + 5,
        y: cytoscapeNodePosition.y + 10,
      },
      force: true,
    });
    await page.mouse.up();

    // Wait 2 seconds for the debounced layout change events to trigger
    await page.waitForTimeout(2000);

    await page.getByRole("button", { name: "Save layout" }).click();
    await expect(page.locator("[data-testid='update-plan-loading-spinner']")).not.toBeVisible();
    await expect(page.locator("body", { hasText: "Unexpected error" })).toHaveCount(0);
    await expect(page.locator("body", { hasText: "Layout saved successfully" })).toBeVisible();
  });
});
