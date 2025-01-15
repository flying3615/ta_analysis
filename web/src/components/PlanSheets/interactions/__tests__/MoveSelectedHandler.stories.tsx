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
  countSelected,
  getCytoscapeNodeLayer,
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
    const test = await TestCanvas.Create(canvasElement, "Select Lines");
    const line: [number, number] = [220, 80];
    await test.click(line);
    await expect(await countSelected()).toBe(1);
    await test.leftClickAndDrag(line, [line[0] + 100, line[1] + 50]);
    await expect(await countSelected()).toBe(1);
  },
};

// Enforces 'play' is provided as it is used in PlanSheetsUndo
export const MoveDiagramNode: Story & Required<Pick<Story, "play">> = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Coordinates");
    const mark: [number, number] = [411 - 280, 136 - 56];
    await test.click(mark);
    await expect(await countSelected()).toBe(2); // both the label and the node is selected
    await test.leftClickAndDrag(mark, [mark[0] + 50, mark[1] + 100]);
    await test.leftClickAndDrag([mark[0] + 50, mark[1] + 100], [mark[0] + 100, mark[1] + 100]); // TODO: check if this is a false positive??
    await expect(await countSelected()).toBe(2);
  },
};

export const MoveDiagramLabel: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");

    const label14: [number, number] = [213, 213];
    const label13: [number, number] = [150, 240];

    await test.click(label14);
    await test.click(label13, true);
    await expect(await countSelected()).toBe(2);

    await test.leftClickAndDrag(label14, [150 + 100, 240 + 100]);
    await expect(await countSelected()).toBe(2);
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
    const test = await TestCanvas.Create(canvasElement, "Select Lines");
    const position: [number, number] = [218, 80];
    const newPosition: [number, number] = [268, 180];
    await test.click(position);
    await test.leftClickAndDrag(position, newPosition);
    await test.contextMenu({ at: newPosition, select: "Original location" });
    await test.waitForCytoscape();
    await expect(await countSelected()).toBe(1);
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

    await test.waitForCytoscape();
    await expect(await countSelected()).toBe(1);

    await test.contextMenu({ at: [213, 213], select: "Properties" });
    await expect(test.findProperty("TextInput", "Text angle (degrees)").getAttribute("value")).toBe("18.2606");
    await test.clickCancelFooter();

    await test.waitForCytoscape();
    await expect(await countSelected()).toBe(1);

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

// labels where the lines are `broken-peck` and anchored to `calculated` coordinate types
const brokenPeckMockPlanData = JSON.parse(JSON.stringify(mockPlanData)) as PlanResponseDTO;
if (brokenPeckMockPlanData.diagrams[0]) {
  brokenPeckMockPlanData.diagrams[0] = {
    ...brokenPeckMockPlanData.diagrams[0],
    coordinates: [
      ...brokenPeckMockPlanData.diagrams[0].coordinates,
      {
        coordType: CoordinateDTOCoordTypeEnum.calculated,
        id: 99999,
        position: { x: 5, y: -25 },
      },
    ],
    lines: [
      ...brokenPeckMockPlanData.diagrams[0].lines,
      {
        id: 9999,
        lineType: "observation",
        style: "brokenPeck1",
        coordRefs: [10001, 99999],
        pointWidth: 0.75,
      },
    ],
    coordinateLabels: [
      ...brokenPeckMockPlanData.diagrams[0].coordinateLabels,
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
      ...brokenPeckMockPlanData.diagrams[0].lineLabels,
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
          HttpResponse.json(brokenPeckMockPlanData, {
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

// irregular line plan data
const irregularLinePlanData = JSON.parse(JSON.stringify(mockPlanData)) as PlanResponseDTO;
if (irregularLinePlanData.diagrams[0]) {
  irregularLinePlanData.diagrams[0] = {
    ...irregularLinePlanData.diagrams[0],
    coordinates: [
      ...irregularLinePlanData.diagrams[0].coordinates,
      {
        coordType: CoordinateDTOCoordTypeEnum.calculated,
        id: 10281,
        position: { x: 15, y: -45 },
        originalCoord: { x: 15, y: -45 },
      },
      {
        coordType: CoordinateDTOCoordTypeEnum.calculated,
        id: 10280,
        position: { x: 5.5, y: -30 },
        originalCoord: { x: 5.5, y: -30 },
      },
      {
        coordType: CoordinateDTOCoordTypeEnum.calculated,
        id: 10279,
        position: { x: 6, y: -25 },
        originalCoord: { x: 6, y: -25 },
      },
      {
        coordType: CoordinateDTOCoordTypeEnum.calculated,
        id: 10278,
        position: { x: 6.5, y: -18 },
        originalCoord: { x: 6.5, y: -18 },
      },
      {
        coordType: CoordinateDTOCoordTypeEnum.calculated,
        id: 10277,
        position: { x: 16, y: -15 },
        originalCoord: { x: 16, y: -15 },
      },
    ],
    lines: [
      ...irregularLinePlanData.diagrams[0].lines,
      {
        id: 9999,
        lineType: "parcelBoundary",
        style: "dot1",
        coordRefs: [10281, 10280, 10279, 10278, 10277, 10001],
        pointWidth: 1.4,
      },
    ],
  };
}
const IrregularLines: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.get(/\/123\/plan$/, () =>
          HttpResponse.json(irregularLinePlanData, {
            status: 200,
            statusText: "OK",
          }),
        ),
        ...handlers,
      ],
    },
  },
};
export const MoveIrregularLinesToOrigin: Story = {
  ...IrregularLines,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(1500);

    const position = { clientX: 330, clientY: 215 };
    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");

    await selectAndDrag(getCytoscapeNodeLayer(cytoscapeElement), position, {
      clientX: position.clientX + 110,
      clientY: position.clientY,
    });
    await sleep(1000);
    clickAtCoordinates(
      getCytoscapeNodeLayer(cytoscapeElement),
      [position.clientX + 110, position.clientY],
      RIGHT_MOUSE_BUTTON,
    );
    await sleep(500);
    const menuOriginLoc = await canvas.findByText("Original location");
    await userEvent.click(menuOriginLoc);
  },
};
