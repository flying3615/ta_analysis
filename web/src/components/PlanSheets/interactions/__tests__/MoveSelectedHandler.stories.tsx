import { Meta } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";

import { Default, Story } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import {
  clickAtCoordinates,
  getCytoscapeNodeLayer,
  getCytoscapeOffsetInCanvas,
  multiSelectAndDrag,
  RIGHT_MOUSE_BUTTON,
  selectAndDrag,
  sleep,
  tabletLandscapeParameters,
} from "@/test-utils/storybook-utils";

export default {
  title: "PlanSheets",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

// Enforces 'play' is provided as it is used in PlanSheetsUndo
export const MoveDiagramLine: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoCanvas = getCytoscapeNodeLayer(cytoscapeElement);

    const position = { clientX: 520, clientY: 136 };
    await selectAndDrag(cytoCanvas, position, { clientX: position.clientX + 100, clientY: position.clientY + 50 });
  },
};

// Enforces 'play' is provided as it is used in PlanSheetsUndo
export const MoveDiagramNode: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Coordinates"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const { cyOffsetX, cyOffsetY } = getCytoscapeOffsetInCanvas(canvasElement, cytoscapeElement);

    // Location of a mark in cytoscape pixels
    const position = { clientX: 411 - 280 + cyOffsetX, clientY: 136 - 56 + cyOffsetY };

    // move broken node out of way (there are two coordinates at position!?!)
    await selectAndDrag(getCytoscapeNodeLayer(cytoscapeElement), position, {
      clientX: position.clientX + 50,
      clientY: position.clientY + 100,
    });

    // wait for re-render, get new canvas element and move prm
    await sleep(500);
    await selectAndDrag(getCytoscapeNodeLayer(cytoscapeElement), position, {
      clientX: position.clientX + 100,
      clientY: position.clientY + 100,
    });
  },
};

// Enforces 'play' is provided as it is used in PlanSheetsUndo
export const MoveDiagramLabel: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Labels"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const { cyOffsetX, cyOffsetY } = getCytoscapeOffsetInCanvas(canvasElement, cytoscapeElement);

    // Location of a label (Label 14: {213,213}, Label13: {303, 240}) in cytoscape pixels
    const position1 = { clientX: 213 + cyOffsetX, clientY: 213 + cyOffsetY };
    const position2 = { clientX: 303 + cyOffsetX, clientY: 240 + cyOffsetY };

    await multiSelectAndDrag(getCytoscapeNodeLayer(cytoscapeElement), [position1, position2], {
      clientX: position2.clientX + 50,
      clientY: position2.clientY + 100,
    });
  },
};

export const MoveNodeToOriginalCoord: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Coordinates"));
    await sleep(500);

    const position = { clientX: 411, clientY: 136 };
    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");

    await selectAndDrag(getCytoscapeNodeLayer(cytoscapeElement), position, {
      clientX: position.clientX + 50,
      clientY: position.clientY + 100,
    });
    await sleep(1500);
    clickAtCoordinates(
      getCytoscapeNodeLayer(cytoscapeElement),
      position.clientX + 50,
      position.clientY + 100,
      RIGHT_MOUSE_BUTTON,
    );
    await sleep(500);
    const menuOriginLoc = await canvas.findByText("Original location");
    await userEvent.click(menuOriginLoc);
  },
};

export const MoveLineToOriginalCoord: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(500);

    const position = { clientX: 498, clientY: 136 };
    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");

    await selectAndDrag(getCytoscapeNodeLayer(cytoscapeElement), position, {
      clientX: position.clientX + 50,
      clientY: position.clientY + 100,
    });
    await sleep(1500);
    clickAtCoordinates(
      getCytoscapeNodeLayer(cytoscapeElement),
      position.clientX + 50,
      position.clientY + 100,
      RIGHT_MOUSE_BUTTON,
    );
    await sleep(500);
    const menuOriginLoc = await canvas.findByText("Original location");
    await userEvent.click(menuOriginLoc);
  },
};

export const AlignLabelToLine: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Labels"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    const { cyOffsetX, cyOffsetY } = getCytoscapeOffsetInCanvas(canvasElement, cytoscapeElement);

    // Location of a label (Label 14: {213,213}) in cytoscape pixels
    clickAtCoordinates(cytoscapeNodeLayer, 213 + cyOffsetX, 213 + cyOffsetY, RIGHT_MOUSE_BUTTON);
    const ctxMenuElement = await within(canvasElement).findByTestId("cytoscapeContextMenu");
    const propertiesMenuItem = within(ctxMenuElement).getByText("Align label to line");
    await userEvent.click(propertiesMenuItem);
    await sleep(500);

    const middlePoint = { x: 98 + cyOffsetX, y: 183 + cyOffsetY };

    // TODO: WIP fix mouse not move here...
    clickAtCoordinates(cytoscapeNodeLayer, middlePoint.x, middlePoint.y);
    await sleep(500);
  },
};
