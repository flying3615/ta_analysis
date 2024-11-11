import { expect, test } from "@playwright/test";

import { DefineDiagramsPage } from "../pages/DefineDiagramsPage";
import { MaintainDiagramLayers } from "../pages/MaintainDiagramLayers";

test.describe("Define diagrams", () => {
  test("Draw primary diagrams, check labelling, maintain diagram layers", async ({ page }, testInfo) => {
    //Set a timeout for page events (e.g. click), otherwise it defaults to the test timeout, which is currently set to 180 sec for local
    page.setDefaultTimeout(30000);
    //Set a timeout for assertion blocks to pass, otherwise it defaults to the test timeout, which is currently set to 180 sec for local
    const timeoutForAssertionBlocksToPass = 30_000;
    const defineDiagramsPage = new DefineDiagramsPage(page);
    //If the test is being retried in the pipeline, use a different clean survey
    const surveyNumber = testInfo.retry ? "5000058" : "5000057";

    await test.step("GIVEN I'm in the Define Diagrams page for a survey", async () => {
      await page.goto(`plan-generation/${surveyNumber}/define-diagrams`);
      await defineDiagramsPage.waitForDiagramsCanvas();
    });
    const originalDiagrams = await defineDiagramsPage.getDiagrams();
    const originalNumberOfDiagrams = originalDiagrams.length;

    await test.step("WHEN I draw a Primary Diagram as a Rectangle", async () => {
      //Draw a primary diagram rectangle
      await defineDiagramsPage.definePrimaryDiagramByRectangleButton.click();
      await page.locator(".diagrams > canvas").click({
        position: {
          x: 823,
          y: 20,
        },
      });
      await page.locator(".ol-layer > canvas").click({
        position: {
          x: 916,
          y: 161,
        },
      });
    });

    await test.step("THEN the diagram is automatically labelled", async () => {
      //Retry the following block of assertions until it passes, or timeout is reached
      await expect(async () => {
        //Assert the number of diagrams has increased
        expect(await defineDiagramsPage.getDiagrams()).toHaveLength(originalNumberOfDiagrams + 1);
        //Assert the diagram has been labelled
        const labelsArray = await defineDiagramsPage.getLabels();
        expect(labelsArray[0]).toEqual({
          id: 3,
          name: "Diag. A",
        });
      }).toPass({ timeout: timeoutForAssertionBlocksToPass });
    });

    //Refresh the page and assert the new diagram remains on the page
    await page.reload();
    await defineDiagramsPage.waitForDiagramsCanvas();
    expect(await defineDiagramsPage.getDiagrams()).toHaveLength(originalNumberOfDiagrams + 1);

    await test.step("WHEN I draw another Primary Diagram", async () => {
      //Draw another primary diagram rectangle
      await defineDiagramsPage.definePrimaryDiagramByRectangleButton.click();
      await page.locator(".diagrams > canvas").click({
        //Without the force click, Playwright throws the following error if a diagram has already been drawn:
        //"subtree intercepts pointer events - retrying click action"
        force: true,
        position: {
          x: 723,
          y: 10,
        },
      });
      await page.locator(".ol-layer > canvas").click({
        position: {
          x: 816,
          y: 151,
        },
      });
    });

    await test.step("THEN the diagrams are re-labelled", async () => {
      //Retry the following block of assertions until it passes, or timeout is reached
      await expect(async () => {
        //Assert the number of diagrams has increased
        expect(await defineDiagramsPage.getDiagrams()).toHaveLength(originalNumberOfDiagrams + 2);
        //Assert the first diagram has been re-labelled and the new diagram has been labelled
        const labelsArray = await defineDiagramsPage.getLabels();
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
      }).toPass({ timeout: timeoutForAssertionBlocksToPass });
    });

    await defineDiagramsPage.maintainDiagramLayersButton.click();
    const maintainDiagramLayers = new MaintainDiagramLayers(page);
    await maintainDiagramLayers.waitForGridReady();

    await test.step("WHEN I change diagram layer settings for a diagram type", async () => {
      await maintainDiagramLayers.listBox.selectOption("User Defined Primary Diagram");
      await maintainDiagramLayers.clickLayersSelectButtonInDiagramsByTypeTab(6);
      expect(await maintainDiagramLayers.getLayerSelectedStateInDiagramsByTypeTab(3)).toEqual("selected");
      expect(await maintainDiagramLayers.getLayerSelectedStateInDiagramsByTypeTab(6)).toEqual("selected");
      await maintainDiagramLayers.clickLabelsCheckboxInDiagramsByTypeTab(6);
      await maintainDiagramLayers.individualUserDefinedDiagramsTab.click();
      await maintainDiagramLayers.unsavedChangesDialogSaveButton.click();
      await maintainDiagramLayers.overwrittenChangesDialogContinueButton.click();
    });

    await test.step("THEN the settings are changed for individual diagrams of that type", async () => {
      await maintainDiagramLayers.listBox.selectOption("Diag. B - User Defined Primary Diagram");
      //Retry the following block of assertions until it passes, or timeout is reached
      await expect(async () => {
        expect(await maintainDiagramLayers.getLayerSelectedStateInDiagramsByIDTab(3)).toEqual("selected");
        expect(await maintainDiagramLayers.getLayerSelectedStateInDiagramsByIDTab(6)).toEqual("selected");
        expect(await maintainDiagramLayers.getLabelsSelectedStateInDiagramsByIDTab(3)).toContain("ag-checked");
        expect(await maintainDiagramLayers.getLabelsSelectedStateInDiagramsByIDTab(6)).not.toContain("ag-checked");
      }).toPass({ timeout: timeoutForAssertionBlocksToPass });
    });

    await test.step("WHEN I change diagram layer settings for an individual diagram", async () => {
      await maintainDiagramLayers.clickLayersSelectButtonInDiagramsByIDTab(7);
      await maintainDiagramLayers.diagramLayersPanelSaveButton.click();
      await maintainDiagramLayers.page.waitForSelector("text='All layers up to date'");
      await maintainDiagramLayers.diagramLayersPanelCloseButton.click();
    });

    await test.step("THEN the settings remain unchanged for the diagram type", async () => {
      await defineDiagramsPage.maintainDiagramLayersButton.click();
      await maintainDiagramLayers.listBox.selectOption("User Defined Primary Diagram");

      //Retry the following block of assertions until it passes, or timeout is reached
      await expect(async () => {
        expect(await maintainDiagramLayers.getLayerSelectedStateInDiagramsByTypeTab(3)).toEqual("selected");
        expect(await maintainDiagramLayers.getLayerSelectedStateInDiagramsByTypeTab(6)).toEqual("selected");
        expect(await maintainDiagramLayers.getLayerSelectedStateInDiagramsByTypeTab(7)).toEqual("not selected");
        expect(await maintainDiagramLayers.getLabelsSelectedStateInDiagramsByTypeTab(3)).toContain("ag-checked");
        expect(await maintainDiagramLayers.getLabelsSelectedStateInDiagramsByTypeTab(6)).not.toContain("ag-checked");
      }).toPass({ timeout: timeoutForAssertionBlocksToPass });
    });

    await test.step("AND the settings are changed for that individual diagram", async () => {
      await maintainDiagramLayers.individualUserDefinedDiagramsTab.click();
      await maintainDiagramLayers.listBox.selectOption("Diag. B - User Defined Primary Diagram");
      //Retry the following block of assertions until it passes, or timeout is reached
      await expect(async () => {
        expect(await maintainDiagramLayers.getLayerSelectedStateInDiagramsByIDTab(3)).toEqual("selected");
        expect(await maintainDiagramLayers.getLayerSelectedStateInDiagramsByIDTab(6)).toEqual("selected");
        expect(await maintainDiagramLayers.getLayerSelectedStateInDiagramsByIDTab(7)).toEqual("selected");
        expect(await maintainDiagramLayers.getLabelsSelectedStateInDiagramsByIDTab(3)).toContain("ag-checked");
        expect(await maintainDiagramLayers.getLabelsSelectedStateInDiagramsByIDTab(6)).not.toContain("ag-checked");
      }).toPass({ timeout: timeoutForAssertionBlocksToPass });
    });

    await test.step("AND the settings are not changed for the other individual diagram", async () => {
      await maintainDiagramLayers.individualUserDefinedDiagramsTab.click();
      await maintainDiagramLayers.listBox.selectOption("Diag. A - User Defined Primary Diagram");
      //Retry the following block of assertions until it passes, or timeout is reached
      await expect(async () => {
        expect(await maintainDiagramLayers.getLayerSelectedStateInDiagramsByIDTab(3)).toEqual("selected");
        expect(await maintainDiagramLayers.getLayerSelectedStateInDiagramsByIDTab(6)).toEqual("selected");
        expect(await maintainDiagramLayers.getLayerSelectedStateInDiagramsByIDTab(7)).toEqual("not selected");
        expect(await maintainDiagramLayers.getLabelsSelectedStateInDiagramsByIDTab(3)).toContain("ag-checked");
        expect(await maintainDiagramLayers.getLabelsSelectedStateInDiagramsByIDTab(6)).not.toContain("ag-checked");
      }).toPass({ timeout: timeoutForAssertionBlocksToPass });
    });
  });
});
