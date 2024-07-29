import { expect, test } from "@playwright/test";
import { getCytoscapeData, getCytoscapeNode } from "utils/cytoscape-utils";

test.describe("Save Layout Plan Sheets", () => {
  test("Save layout in title sheet diagram", async ({ page, baseURL }) => {
    await page.goto("/plan-generation/layout-plan-sheets/5000056");
    await expect(page.getByRole("heading", { name: "Title sheet diagrams" })).toBeVisible({ timeout: 180000 }); // for tet
    const cytoscapeData = await getCytoscapeData(page, baseURL);
    const { position: cytoscapeNodePosition } = getCytoscapeNode(2, cytoscapeData);

    for (let i = 0; i < 4; i++) {
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
    }

    await page.mouse.up();
    await page.getByRole("button", { name: "Save layout" }).click();
    const savedSuccessfully = page.locator("body", { hasText: "Layout saved successfully" });
    await savedSuccessfully.waitFor();
  });
});
