import { expect, test } from "@playwright/test";

import { DefineDiagramsPage } from "../pages/DefineDiagramsPage";

test.describe("Define diagrams", () => {
  test("Draw primary diagrams and check labelling", async ({ page }, testInfo) => {
    const defineDiagramsPage = new DefineDiagramsPage(page);
    //If the test is being retried in the pipeline, use a different clean survey
    const surveyNumber = testInfo.retry ? "5000058" : "5000057";
    await page.goto(`plan-generation/define-diagrams/${surveyNumber}`);
    await defineDiagramsPage.waitForDiagramsCanvas();
    const originalDiagrams = await defineDiagramsPage.getDiagrams();
    const originalNumberOfDiagrams = originalDiagrams.length;

    //Draw a primary diagram rectangle
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
    //Assert the number of diagrams has increased
    expect(await defineDiagramsPage.getDiagrams()).toHaveLength(originalNumberOfDiagrams + 1);
    //Assert the diagram has been labelled
    let labelsArray = await defineDiagramsPage.getLabels();
    expect(labelsArray[0]).toEqual({
      id: 3,
      name: "Diag. A",
    });

    //Refresh the page and assert the new diagram remains on the page
    await page.reload();
    await defineDiagramsPage.waitForDiagramsCanvas();
    expect(await defineDiagramsPage.getDiagrams()).toHaveLength(originalNumberOfDiagrams + 1);

    //Draw another primary diagram rectangle
    await defineDiagramsPage.definePrimaryDiagramButton.click();
    await defineDiagramsPage.definePrimaryDiagramByRectangle.click();
    await page.locator(".diagrams > canvas").click({
      //Without the force click, Playwright throws the following error if a diagram has already been drawn:
      //"subtree intercepts pointer events - retrying click action"
      force: true,
      position: {
        x: 623,
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
    //Assert the number of diagrams has increased
    expect(await defineDiagramsPage.getDiagrams()).toHaveLength(originalNumberOfDiagrams + 2);
    //Assert the first diagram has been re-labelled and the new diagram has been labelled
    labelsArray = await defineDiagramsPage.getLabels();
    expect(labelsArray).toEqual([
      {
        id: 3,
        name: "Diag. B",
      },
      {
        id: 4,
        name: "Diag. A",
      },
    ]);
  });
});
