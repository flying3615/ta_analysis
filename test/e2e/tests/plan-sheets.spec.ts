import { expect, test } from "@playwright/test";
import { PlanSheetsPage } from "pages/PlanSheetsPage";

test.describe("Layout Plan Sheets", () => {
  test("Save layout in title sheet diagram", async ({ page, baseURL }) => {
    const planSheetsPage = new PlanSheetsPage(page, baseURL);

    await page.goto("/plan-generation/layout-plan-sheets/5000056");
    await expect(page.getByRole("heading", { name: "Title sheet diagrams" })).toBeVisible({ timeout: 180000 });

    const nodeIdToMove = "4";
    const cytoscapeData = (await planSheetsPage.fetchCytoscapeData()).getCytoscapeData();
    const { position: cytoscapeNodePosition } = planSheetsPage.getCytoscapeNode(nodeIdToMove);

    // Move a mark to trigger a layout change
    await planSheetsPage.getCytoscapeCanvas().hover({
      position: {
        x: cytoscapeNodePosition.x,
        y: cytoscapeNodePosition.y,
      },
      force: true,
    });
    await page.mouse.down();
    await planSheetsPage.getCytoscapeCanvas().hover({
      position: {
        x: cytoscapeNodePosition.x + 15,
        y: cytoscapeNodePosition.y + 25,
      },
      force: true,
    });
    await page.mouse.up();

    // Wait 2 seconds for the debounced layout change events to trigger
    await page.waitForTimeout(2000);

    // Check that the only change to cytoscape is that the position of node 4 has changed, and nothing else
    const updatedCytoscapeData = (await planSheetsPage.fetchCytoscapeData()).getCytoscapeData();
    const updatedNode = updatedCytoscapeData.elements.nodes.find((node) => node.data.id === nodeIdToMove);
    const expectedCytoscapeNodes = cytoscapeData.elements.nodes.map((node) => {
      if (node.data.id === nodeIdToMove) {
        return {
          ...node,
          position: {
            // eslint-disable-next-line playwright/no-conditional-expect
            x: expect.any(Number),
            // eslint-disable-next-line playwright/no-conditional-expect
            y: expect.any(Number),
          },
        };
      }
      return node;
    });
    expect(updatedCytoscapeData).toStrictEqual({
      ...cytoscapeData,
      elements: {
        ...cytoscapeData.elements,
        nodes: expectedCytoscapeNodes,
      },
    });
    expect(updatedNode.position).not.toStrictEqual(cytoscapeNodePosition);

    // Now actually save and ensure there is a successful response
    await page.getByRole("button", { name: "Save layout" }).click();
    await expect(page.locator("[data-testid='update-plan-loading-spinner']")).not.toBeVisible();
    await expect(page.locator("body", { hasText: "Unexpected error" })).toHaveCount(0);
    await expect(page.locator("body", { hasText: "Layout saved successfully" })).toBeVisible();

    // TODO: Check that when the page is refreshed, the layout reloads with the saved layout
  });
});
