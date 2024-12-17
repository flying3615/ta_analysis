import { expect, test } from "@playwright/test";
import { Page } from "playwright-core";

import { PlanSheetsPage } from "../pages/PlanSheetsPage";

test.describe("Layout Plan Sheets updates are retained even after regeneration", () => {
  test("Update LPS and save; update label preferences (regen) and verify the changes are retained after regeneration", async ({
    page,
    baseURL,
  }) => {
    const planSheetsPage = new PlanSheetsPage(page, baseURL);
    const lineDistanceLabelToMove = "21.62";
    const lineBearingLabelToMove = "218°55'00\"";
    const lineDistanceLabelNewPosition = { x: 147.72, y: 235.55 };
    const lineBearingLabelNewPosition = { x: 180.0, y: 250.51 };

    await page.goto("/plan-generation/5000056/layout-plan-sheets");
    await expect(page.getByRole("heading", { name: "Title sheet diagrams" })).toBeVisible();
    await page.getByRole("button", { name: "Select Labels" }).click();

    // change position of line distance and line bearing labels
    await moveLabelToPosition(planSheetsPage, lineDistanceLabelToMove, page, lineDistanceLabelNewPosition);
    await moveLabelToPosition(planSheetsPage, lineBearingLabelToMove, page, lineBearingLabelNewPosition);

    // save and ensure there is a successful response
    await page.getByRole("button", { name: "Save layout" }).click();
    await expect(page.getByRole("heading", { name: "Layout saving..." })).not.toBeVisible();
    await expect(page.locator("body", { hasText: "Layout saved successfully" })).toBeVisible();

    // navigate back to Label preferences and update a setting so that regeneration is triggered
    await page.goto("/plan-generation/5000056");
    await expect(page.getByRole("heading", { name: "Plan generation" })).toBeVisible();
    const labelPreferencesButton = page.getByText("Label Preferences");
    await labelPreferencesButton.click();
    // uncheck bold setting for observation bearing and save
    await page.getByRole("row", { name: "Observation Bearing Label" }).getByRole("gridcell").nth(4).click();
    await page.getByRole("button", { name: "Save" }).click();

    await page.goto("/plan-generation/5000056/layout-plan-sheets");
    await expect(page.getByRole("heading", { name: "Title sheet diagrams" })).toBeVisible();
    (await planSheetsPage.fetchCytoscapeData()).getCytoscapeData();
    const { position: lineDistanceLabelPosition } = planSheetsPage.getCytoscapeNodeByLabel(lineDistanceLabelToMove);
    const { position: lineBearingLabelPosition } = planSheetsPage.getCytoscapeNodeByLabel(lineBearingLabelToMove);
    // verify the label positions are retained and not reverted to original location after regeneration
    expect(lineDistanceLabelPosition.x).toBeCloseTo(lineDistanceLabelNewPosition.x, 0);
    expect(lineDistanceLabelPosition.y).toBeCloseTo(lineDistanceLabelNewPosition.y, 0);
    expect(lineBearingLabelPosition.x).toBeCloseTo(lineBearingLabelNewPosition.x, 0);
    expect(lineBearingLabelPosition.y).toBeCloseTo(lineBearingLabelNewPosition.y, 0);
  });
});

async function moveLabelToPosition(
  planSheetsPage: PlanSheetsPage,
  labelToMove: string,
  page: Page,
  newPosition: {
    x: number;
    y: number;
  },
): Promise<void> {
  (await planSheetsPage.fetchCytoscapeData()).getCytoscapeData();
  const { position: cytoscapeNodePosition } = planSheetsPage.getCytoscapeNodeByLabel(labelToMove);

  // Select the label to move
  await planSheetsPage.getCytoscapeCanvas().click({
    position: {
      x: cytoscapeNodePosition.x,
      y: cytoscapeNodePosition.y,
    },
    button: "left",
    force: true,
  });

  // Move a label to trigger a layout change
  await planSheetsPage.getCytoscapeCanvas().hover({
    position: {
      x: cytoscapeNodePosition.x,
      y: cytoscapeNodePosition.y,
    },
    force: true,
  });
  await page.mouse.down();
  await planSheetsPage.getCytoscapeCanvas().hover({
    position: newPosition,
    force: true,
  });
  await page.mouse.up();

  // Wait 2 seconds for the debounced layout change events to trigger
  await page.waitForTimeout(2000);
}
