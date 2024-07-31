import { expect, test } from "@playwright/test";

import { DefineDiagramsPage } from "../pages/DefineDiagramsPage";

test.describe("Define diagrams", () => {
  test("Draw a primary diagram as a rectangle", async ({ page }) => {
    const defineDiagramsPage = new DefineDiagramsPage(page);
    await page.goto("plan-generation/define-diagrams/5000057");
    await defineDiagramsPage.waitForDiagramsCanvas();
    const originalDiagrams = await defineDiagramsPage.getDiagrams();
    const originalNumberOfDiagrams = originalDiagrams.length;
    await defineDiagramsPage.definePrimaryDiagramButton.click();
    await defineDiagramsPage.definePrimaryDiagramByRectangle.click();
    await page.locator(".diagrams > canvas").click({
      position: {
        x: 823,
        y: 10,
      },
    });
    await page.locator(".ol-layer > canvas").click({
      position: {
        x: 916,
        y: 161,
      },
    });
    //Allow an extra 2 seconds for the operation to complete
    await page.waitForTimeout(2000);
    //Assert the number of diagrams has increased by one
    expect(await defineDiagramsPage.getDiagrams()).toHaveLength(originalNumberOfDiagrams + 1);
    //Refresh the page and assert the new diagram remains on the page
    await page.reload();
    await defineDiagramsPage.waitForDiagramsCanvas();
    expect(await defineDiagramsPage.getDiagrams()).toHaveLength(originalNumberOfDiagrams + 1);
  });
});
