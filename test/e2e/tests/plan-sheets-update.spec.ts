import { expect, test } from "@playwright/test";
import { PlanSheetsPage } from "pages/PlanSheetsPage";

test.describe("Layout Plan Sheets Updating", () => {
  test("Move a coordinate and save layout in title sheet diagram", async ({ page, baseURL }) => {
    const planSheetsPage = new PlanSheetsPage(page, baseURL);

    await page.goto("/plan-generation/5000056/layout-plan-sheets");
    await expect(page.getByRole("heading", { name: "Title sheet diagrams" })).toBeVisible();

    const nodeLabelToMove = "XLI DP 7441";
    const cytoscapeData = (await planSheetsPage.fetchCytoscapeData()).getCytoscapeData();
    const { position: cytoscapeNodePosition } = planSheetsPage.getCytoscapeNodeByLabel(nodeLabelToMove);
    console.log(`From position: ${JSON.stringify(cytoscapeNodePosition)}`);

    // Go into coordinate selection mode
    await page.getByRole("button", { name: "Select Coordinates" }).click();

    // Select the coordinate to move
    await planSheetsPage.getCytoscapeCanvas().hover({
      position: {
        x: cytoscapeNodePosition.x,
        y: cytoscapeNodePosition.y,
      },
      force: true,
    });
    await page.mouse.down();

    // Move a coordinate to trigger a layout change
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
    const updatedNode = updatedCytoscapeData.elements.nodes.find((node) => node.data.label === nodeLabelToMove);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const expectedCytoscapeNodes = cytoscapeData.elements.nodes.map((node) => {
      // We only consider mark name labels here
      // The symbol will also be moving
      if (node.data.label === nodeLabelToMove || node.data.label !== "markName") {
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

    // TODO: Fix this assertion in SJ-1670
    // expect(updatedCytoscapeData).toEqual({
    //   ...cytoscapeData,
    //   elements: {
    //     ...cytoscapeData.elements,
    //     nodes: expectedCytoscapeNodes,
    //   },
    // });

    console.log(`After position: ${JSON.stringify(updatedNode.position)}`);
    // TODO: Fix this assertion in SJ-1670
    // expect(updatedNode.position).not.toStrictEqual(cytoscapeNodePosition);

    // Now actually save and ensure there is a successful response
    await page.getByRole("button", { name: "Save layout" }).click();
    await expect(page.getByRole("heading", { name: "Layout saving..." })).not.toBeVisible();
    await expect(page.locator("body", { hasText: "Unexpected error" })).toHaveCount(0);
    await expect(page.locator("body", { hasText: "Layout saved successfully" })).toBeVisible();

    // TODO: Check that when the page is refreshed, the layout reloads with the saved layout
  });
});
