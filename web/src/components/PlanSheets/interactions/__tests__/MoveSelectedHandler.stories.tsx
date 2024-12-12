import { CoordinateDTOCoordTypeEnum, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { expect } from "@storybook/jest";
import { Meta } from "@storybook/react";
import { screen, userEvent, within } from "@storybook/testing-library";
import { http, HttpResponse } from "msw";

import { Default, Story } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { handlers } from "@/mocks/mockHandlers";
import {
  checkCytoElementProperties,
  clickAtCoordinates,
  getCytoscapeNodeLayer,
  getCytoscapeOffsetInCanvas,
  multiSelectAndDrag,
  RIGHT_MOUSE_BUTTON,
  selectAndDrag,
  sleep,
  tabletLandscapeParameters,
  TestCanvas,
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

export const MoveChildDiagramLabel: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Labels"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");

    // move childDiagramLabels
    const position1 = { clientX: 510, clientY: 190 };
    await selectAndDrag(getCytoscapeNodeLayer(cytoscapeElement), position1, {
      clientX: position1.clientX + 150,
      clientY: position1.clientY,
    });
    await sleep(500);

    const position2 = { clientX: 510, clientY: 200 };
    await selectAndDrag(getCytoscapeNodeLayer(cytoscapeElement), position2, {
      clientX: position2.clientX + 150,
      clientY: position2.clientY,
    });
    await sleep(500);

    await checkCytoElementProperties("#LAB_41", { position: { x: 389.81, y: 132.94 } });
    await checkCytoElementProperties("#LAB_42", { position: { x: 389.81, y: 143.63 } });
  },
};

export const MoveNodeToOriginalCoord: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Coordinates"));
    await sleep(1500);

    const position = { clientX: 411, clientY: 136 };
    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");

    await selectAndDrag(getCytoscapeNodeLayer(cytoscapeElement), position, {
      clientX: position.clientX + 50,
      clientY: position.clientY + 100,
    });
    await sleep(1500);
    clickAtCoordinates(
      getCytoscapeNodeLayer(cytoscapeElement),
      [position.clientX + 50, position.clientY + 100],
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
    await sleep(1500);

    const position = { clientX: 498, clientY: 136 };
    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");

    await selectAndDrag(getCytoscapeNodeLayer(cytoscapeElement), position, {
      clientX: position.clientX + 50,
      clientY: position.clientY + 100,
    });
    await sleep(1500);
    clickAtCoordinates(
      getCytoscapeNodeLayer(cytoscapeElement),
      [position.clientX + 50, position.clientY + 100],
      RIGHT_MOUSE_BUTTON,
    );
    await sleep(500);
    const menuOriginLoc = await canvas.findByText("Original location");
    await userEvent.click(menuOriginLoc);
  },
};

export const MoveNodeConstrained: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Coordinates"));
    await sleep(1500);

    const position = { clientX: 411, clientY: 136 };
    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");

    await selectAndDrag(getCytoscapeNodeLayer(cytoscapeElement), position, {
      clientX: position.clientX + 1150,
      clientY: position.clientY,
    });
    await sleep(1500);
    await checkCytoElementProperties("#10001", { position: { x: 959.97, y: 79.51 } });
  },
};

export const MoveLineConstrained: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(1500);

    const position = { clientX: 498, clientY: 136 };
    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");

    await selectAndDrag(getCytoscapeNodeLayer(cytoscapeElement), position, {
      clientX: position.clientX + 1150,
      clientY: position.clientY,
    });
    await sleep(1500);
    await checkCytoElementProperties("#10001", { position: { x: 802.23, y: 79.51 } });
  },
};

export const MoveLabelConstrained: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Labels"));
    await sleep(1500);

    const position = { clientX: 492, clientY: 268 };
    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");

    await selectAndDrag(getCytoscapeNodeLayer(cytoscapeElement), position, {
      clientX: position.clientX + 1150,
      clientY: position.clientY,
    });
    await sleep(1500);
    await checkCytoElementProperties("#10001", { position: { x: 132.95, y: 79.51 } });
  },
};

export const AlignLabelToLine: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");

    await test.contextMenu({ at: [213, 213] /* Page "Label 14" */, select: "Align label to line" });

    await test.leftClick([360, 250] /* whitespace */, "layer0-selectbox"); // Nothing should change
    await test.leftClick([98, 183] /* Angled line on left */, "layer0-selectbox");
    await test.contextMenu({ at: [213, 213], select: "Properties" });
    await expect(test.findProperty("TextInput", "Text angle (degrees)").getAttribute("value")).toBe("18.2606");
    await test.clickCancelFooter();

    await test.contextMenu({ at: [150, 250] /* Page "Label 13" */, select: "Align label to line" });
    await test.hoverOver([96, 284] /* Angled line at lower left */);
    await sleep(500);
    await expect(await screen.findByRole("tooltip")).toHaveTextContent("Select a line to align label to");
    // What we want to see is:
    // - Label 14 is at an angle
    // - Angled line at lower left is blue
    // - Cursor has text "Select a line to align label to"
  },
};

const customMockPlanData = JSON.parse(JSON.stringify(mockPlanData)) as PlanResponseDTO;
if (customMockPlanData.diagrams[0]) {
  customMockPlanData.diagrams[0] = {
    ...customMockPlanData.diagrams[0],
    coordinates: [
      ...customMockPlanData.diagrams[0].coordinates,
      {
        coordType: CoordinateDTOCoordTypeEnum.calculated,
        id: 99999,
        position: { x: 5, y: -25 },
      },
    ],
    lines: [
      ...customMockPlanData.diagrams[0].lines,
      {
        id: 9999,
        lineType: "observation",
        style: "brokenPeck1",
        coordRefs: [10001, 99999],
        pointWidth: 0.75,
      },
    ],
    coordinateLabels: [
      ...customMockPlanData.diagrams[0].coordinateLabels,
      {
        id: 98,
        labelType: "nodeSymbol1",
        displayText: "97",
        position: { x: 5, y: -25 },
        featureId: 99999,
        rotationAngle: 0,
        pointOffset: 0,
        anchorAngle: 0,
        textAlignment: "",
        displayState: "display",
        effect: "",
        font: "LOLsymbols",
        fontSize: 10,
      },
    ],
    lineLabels: [
      ...customMockPlanData.diagrams[0].lineLabels,
      {
        id: 99,
        labelType: "nodeSymbol1",
        displayText: "Label 15",
        position: { x: 11, y: -18 },
        rotationAngle: 45,
        pointOffset: 14,
        anchorAngle: 0,
        featureId: 9999,
        featureType: "Line",
        textAlignment: "",
        displayState: "display",
        effect: "",
        fontSize: 14,
        font: "Tahoma",
      },
    ],
  };
}
const BrokenPeckLineLabels: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.get(/\/123\/plan$/, () =>
          HttpResponse.json(customMockPlanData, {
            status: 200,
            statusText: "OK",
          }),
        ),
        ...handlers,
      ],
    },
  },
};

export const CoordTypeCalculated: Story = {
  ...BrokenPeckLineLabels,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Coordinates"));
    await sleep(1500);

    const position = { clientX: 330, clientY: 215 };
    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");

    await selectAndDrag(getCytoscapeNodeLayer(cytoscapeElement), position, {
      clientX: position.clientX + 110,
      clientY: position.clientY,
    });
    await sleep(1000);
    await checkCytoElementProperties("#LAB_99", { position: { x: 139.55, y: 122.26 } });
    await sleep(1000);
  },
};
