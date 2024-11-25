import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import {
  ModalStoryWrapper,
  sleep,
  StorybookRouter,
  tabletLandscapeParameters,
  TestCanvas,
} from "@/test-utils/storybook-utils";

export default {
  title: "PlanSheets/PageLine",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

type Story = StoryObj<typeof PlanSheets>;

const queryClient = new QueryClient();

const PlanSheetsTemplate = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ModalStoryWrapper>
          <StorybookRouter url={generatePath(Paths.layoutPlanSheets, { transactionId: "123" })}>
            <Route path={Paths.layoutPlanSheets} element={<PlanSheets />} />
          </StorybookRouter>
        </ModalStoryWrapper>
      </Provider>
    </QueryClientProvider>
  );
};

export const Default: Story = {
  render: () => <PlanSheetsTemplate />,
};

export const AddLineEnter: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Add line");
    await test.leftClick([363, 220]);
    await test.leftClick([241, 289]);
    await test.leftClick([180, 182]);
    await test.enterAt([405, 280]);
    await test.mouseMove([354, 135]);
    // The following should be verified by chromatic:
    // The View button should be enabled, the Add line button disabled
    // There should be a line with 3 segments.
    // The last mouse move should not produce a new segment
    const line = window.cyRef.$('edge[lineId = "160014"]'); // the new line added
    await expect(line.length).toBe(3); // 3 segments
    const line_first_segment = line[0]!;
    await expect(line_first_segment.data("coordRefs")).toEqual("[160004,160005,160006,160007]"); // the coordinates created for the line
  },
};

export const AddLineDoubleClick: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Add line");
    await test.leftClick([363, 220]);
    await test.leftClick([241, 289]);
    await test.leftClick([1237, 277]); // Outside the sheet. Shouldn't do anything
    await test.leftClick([180, 182]);
    await test.doubleClick([405, 280]);
    await test.mouseMove([354, 135]);
    // The following should be verified by chromatic:
    // The View button should be enabled, the Add line button disabled
    // There should be a line with 3 segments.
    // The last mouse move should not produce a new segment
  },
};

export const AddLineWithArrowsEnter: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Add line");
    await test.leftClick([363, 220]);
    await test.leftClick([241, 289]);
    await test.leftClick([180, 182]);
    await test.leftClick([405, 280]);
    await test.enterAt([405, 280]); // Hitting enter at the same point as the last click replicates a problem

    await test.clickTitle("Select Lines");
    await test.contextMenu({ at: [405, 280], select: "Properties" });
    const styleSelector = test.findProperty("RadioInput", "Line style");
    await test.user.click(styleSelector.querySelector(`input[name="doubleArrow1"]`) as Element);
    await test.clickButton("OK");

    // The following should be verified by chromatic:
    // The View button should be enabled, the Add line button disabled
    // There should be a line with 3 segments.
    // The line should have a double arrow style (arrows at both ends of the line)
  },
};

export const AddLineWithArrowsDoubleClick: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Add line");
    await test.leftClick([363, 220]);
    await test.leftClick([241, 289]);
    await test.leftClick([1237, 277]); // Outside the sheet. Shouldn't do anything
    await test.leftClick([180, 182]);
    await test.doubleClick([405, 280]); // Double click was adding a zero length line

    await test.clickTitle("Select Lines");
    await test.contextMenu({ at: [180, 182], select: "Properties" });
    const styleSelector = test.findProperty("RadioInput", "Line style");
    await test.user.click(styleSelector.querySelector(`input[name="doubleArrow1"]`) as Element);
    await test.clickButton("OK");

    // The following should be verified by chromatic:
    // There should be a line with 3 segments.
    // The line should have a double arrow style (arrows at both ends of the line)
  },
};

export const HoverLineVertex: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Add line");

    const pointA: [number, number] = [50, 200];
    const pointB: [number, number] = [275, 40];
    const pointC: [number, number] = [500, 200];

    // Make a simple line
    await test.leftClick(pointA);
    await test.doubleClick(pointB);
    await test.clickTitle("Select Lines");

    // Hover over the line end
    await test.mouseMove(pointB);

    // Move the mouse without selecting the vertex
    await test.mouseMove(pointC);

    // Move back to the line end and end the test
    await test.mouseMove(pointB);

    // The following should be verified by chromatic:
    //  - The line shape should not change
    //  - The hover effect should be visible and not selected (e.g. a blue circle around the vertex with no pink circle)
  },
};

export const SelectLineVertex: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Add line");

    const pointA: [number, number] = [50, 200];
    const pointB: [number, number] = [275, 40];

    // Make a simple line and switch to select lines mode
    await test.leftClick(pointA);
    await test.doubleClick(pointB);
    await test.clickTitle("Select Lines");

    // Select the vertex
    await test.leftClick(pointA);

    // The following should be verified by chromatic:
    //  - The line shape should not change
    //  - The selected vertex effect should be visible - e.g. a blue circle around the vertex with no pink circle
  },
};

export const MovePageLine: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Add line");

    const pointA: [number, number] = [50, 200];
    const pointB: [number, number] = [275, 40];
    const pointC: [number, number] = [500, 200];
    const pointD: [number, number] = [275, 360];

    // Make a ^ shape
    await test.leftClick(pointA);
    await test.leftClick(pointB);
    await test.doubleClick(pointC);

    // Click the header button "Select lines"
    await test.clickTitle("Select Lines");

    // Select the mid-point of the first line segment (we want to select the whole line
    const pointABMid: [number, number] = [(pointA[0] + pointB[0]) / 2, (pointA[1] + pointB[1]) / 2];
    await test.leftClick(pointABMid);

    // Now that the line is selected, move it downwards
    await test.leftClickAndDrag(pointABMid, pointD);

    // The following should be verified by chromatic:
    // - the line shape should stay the same i.e. the ^ shape, but the line should be moved downwards
    // - the line selected state should not be visible - once a line has moved, the line should be unselected
  },
};

export const MoveLineVertex: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Add line");

    const pointA: [number, number] = [50, 200];
    const pointB: [number, number] = [275, 40];
    const pointC: [number, number] = [500, 200];
    const pointD: [number, number] = [275, 360];

    // Make a ^ shape
    await test.leftClick(pointA);
    await test.leftClick(pointB);
    await test.doubleClick(pointC);

    // Click the header button "Select lines". Yes, this is "correct". To move a Page line vertex you need to be in
    // "Select lines" mode and not "Select coordinates" mode.
    await test.clickTitle("Select Lines");

    // Select the vertex
    await test.leftClick(pointB);

    // Move pointB downwards to make a V shape
    await test.leftClickAndDrag(pointB, pointD);

    // The following should be verified by chromatic:
    // The line shape should change from a ^ shape to a V shape
    // The vertex selected state should not be visible - once a line has moved, the vertex should be unselected
  },
};

export const AddLineRetainsLineStyle: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Add line");
    await test.leftClick([363, 220]);
    await test.leftClick([241, 289]);
    await test.leftClick([180, 182]);
    await test.doubleClick([405, 280]);
    await test.mouseMove([354, 135]);

    await test.clickTitle("Select Lines");
    await test.contextMenu({ at: [180, 182], select: "Properties" });
    let styleSelector = test.findProperty("RadioInput", "Line style");
    // eslint-disable-next-line testing-library/no-node-access
    await test.user.click(styleSelector.querySelector(`input[name="peckDot1"]`) as Element);
    // let widthSelector = test.findProperty("RadioInput", "Width (pts)");
    // await test.user.click(widthSelector.querySelector(`input[name="1.4"]`) as Element);
    await test.clickButton("OK");

    await test.clickTitle("Add line");
    await test.leftClick([391, 132]);
    await test.leftClick([197, 132]);
    await test.doubleClick([207, 106]);

    await test.clickTitle("Select Lines");
    await test.contextMenu({ at: [197, 132], select: "Properties" });
    styleSelector = test.findProperty("RadioInput", "Line style");
    // eslint-disable-next-line testing-library/no-node-access
    await expect(styleSelector.querySelector(`input[name="peckDot1"]`)).toBeChecked();
    // widthSelector = test.findProperty("RadioInput", "Width (pts)");
    // await expect(widthSelector.querySelector(`input[name="1.4"]`)).toBeChecked();
    await test.clickButton("Cancel");

    // Chromatic will ensure the new line style is observed
  },
};

export const CutCopyPasteContextMenuValidation: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Lines");
    await test.waitForCytoscape();

    // verify that the cut, copy and paste context menu is disabled when right-click action menu is opened in white space (no line selected)
    await test.rightClick([336, 237]); // open context menu in white space
    await expect(await test.findMenuItem("Cut")).toHaveAttribute("aria-disabled", "true");
    await expect(await test.findMenuItem("Copy")).toHaveAttribute("aria-disabled", "true");
    await expect(await test.findMenuItem("Paste")).toHaveAttribute("aria-disabled", "true");

    // verify that the cut, copy and paste context menu is disabled when right-click action menu is opened for diagram line
    await test.rightClick([367, 400]); // open context menu for diagram line
    await expect(await test.findMenuItem("Cut")).toHaveAttribute("aria-disabled", "true");
    await expect(await test.findMenuItem("Copy")).toHaveAttribute("aria-disabled", "true");
    await expect(await test.findMenuItem("Paste")).toHaveAttribute("aria-disabled", "true");

    // verify that the cut, copy are enabled and paste menu is disabled when right-click action menu is opened for page line
    await test.rightClick([560, 230]); // open context menu for page line
    await expect(await test.findMenuItem("Cut")).toHaveAttribute("aria-disabled", "false");
    await expect(await test.findMenuItem("Copy")).toHaveAttribute("aria-disabled", "false");
    await expect(await test.findMenuItem("Paste")).toHaveAttribute("aria-disabled", "true");
  },
};

export const SelectCopyPageLineKeepsLine: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Lines");
    await test.waitForCytoscape();
    await test.contextMenu({ at: [560, 230], select: "Copy" }); // select copy action for page line
    await test.rightClick([336, 237]); // open context menu in white space
    await expect(await test.findMenuItem("Cut")).toHaveAttribute("aria-disabled", "true");
    await expect(await test.findMenuItem("Copy")).toHaveAttribute("aria-disabled", "true");
    await expect(await test.findMenuItem("Paste")).toHaveAttribute("aria-disabled", "false");
    // Chromatic will ensure the line is still present after copy action selected
    // Chromatic will ensure the paste action is enabled in white space (stores the copied line in paste buffer)
  },
};

export const SelectCutPageLineRemovesLine: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Lines");
    await test.waitForCytoscape();
    await test.contextMenu({ at: [560, 230], select: "Cut" }); // select cut action for page line
    await test.rightClick([336, 237]); // open context menu in white space
    await expect(await test.findMenuItem("Cut")).toHaveAttribute("aria-disabled", "true");
    await expect(await test.findMenuItem("Copy")).toHaveAttribute("aria-disabled", "true");
    await expect(await test.findMenuItem("Paste")).toHaveAttribute("aria-disabled", "false");
    // Chromatic will ensure the line is removed after cut action selected
    // Chromatic will ensure the paste action is enabled in white space (stores the cut line in paste buffer)
  },
};

export const CopyPastePageLine: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Lines");
    await test.waitForCytoscape();
    await test.contextMenu({ at: [560, 230], select: "Copy" }); // select copy action for page line
    await test.contextMenu({ at: [440, 53], select: "Paste" }); // select paste action in white space
    await test.contextMenu({ at: [440, 550], select: "Paste" }); // select paste action again for page line (copied line still in paste buffer)
    // Chromatic will ensure the line is pasted in the white space at mouse click location
    // Chromatic will ensure selecting the paste action does not clear the paste-buffer (i.e. multiple paste operations can be done)
    await sleep(2000);
    const line1 = window.cyRef.$('edge[lineId = "160014"]'); // the new line created by first paste action
    await expect(line1.length).toBe(1); // 1 segment
    const line1_first_segment = line1[0]!;
    await expect(line1_first_segment.data("coordRefs")).toEqual("[160004,160005]");
    const line2 = window.cyRef.$('edge[lineId = "160015"]'); // the new line created by second paste action
    await expect(line2.length).toBe(1); // 1 segment
    const line2_first_segment = line2[0]!;
    await expect(line2_first_segment.data("coordRefs")).toEqual("[160006,160007]");
  },
};

export const CutPastePageLine: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Lines");
    await test.waitForCytoscape();
    const lineToCut = window.cyRef.$('edge[lineId = "10013"]'); // the line to be cut
    await expect(lineToCut.length).toBe(1);
    await test.contextMenu({ at: [560, 230], select: "Cut" }); // select cut action for page line
    await test.contextMenu({ at: [440, 550], select: "Paste" }); // select paste action for page line
    // Chromatic will ensure the line is removed from original position and pasted in the white space at mouse click location
    await sleep(2000);
    const pastedLine = window.cyRef.$('edge[lineId = "160014"]'); // the new line created by paste action
    await expect(pastedLine.length).toBe(1);
    const removedLine = window.cyRef.$('edge[lineId = "10013"]');
    await expect(removedLine.length).toBe(0); // the line is removed after cut action
  },
};

export const CopyPastePageLineAcrossPages: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Lines");
    await test.waitForCytoscape();
    await test.contextMenu({ at: [560, 230], select: "Copy" }); // select copy action for page line
    await test.clickButton("Next"); // navigate to next page
    await test.contextMenu({ at: [440, 300], select: "Paste" }); // select paste action in white space on next page
    // Chromatic will ensure the line is pasted in the white space at mouse click location on the next page
    await sleep(2000);
    const pastedLine = window.cyRef.$('edge[lineId = "160014"]'); // the new line created by paste action
    await expect(pastedLine.length).toBe(1);
    await expect(pastedLine.data("coordRefs")).toEqual("[160004,160005]");
  },
};
