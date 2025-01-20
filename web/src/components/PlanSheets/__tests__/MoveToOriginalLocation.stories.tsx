import { CoordinateDTOCoordTypeEnum, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { expect } from "@storybook/jest";
import { Meta } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import { http, HttpResponse } from "msw";

import { Default, Story } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { handlers } from "@/mocks/mockHandlers";
import {
  clickAtCoordinates,
  countSelected,
  getCytoscapeNodeLayer,
  multiSelectAndDrag,
  RIGHT_MOUSE_BUTTON,
  selectAndDrag,
  sleep,
  tabletLandscapeParameters,
  TestCanvas,
} from "@/test-utils/storybook-utils";

export default {
  title: "PlanSheets/MoveToOriginalLocation",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

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

export const MoveMultipleCoordinatesToOrigin: Story = {
  ...IrregularLines,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Coordinates"));
    await sleep(1500);

    const position1 = { clientX: 411, clientY: 136 };
    const position2 = { clientX: 411 + 160, clientY: 136 };
    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    await multiSelectAndDrag(
      getCytoscapeNodeLayer(cytoscapeElement),
      [position1, position2],
      {
        clientX: 622,
        clientY: 110,
      },
      2,
    );
    await sleep(1000);
    clickAtCoordinates(getCytoscapeNodeLayer(cytoscapeElement), [622, 110], RIGHT_MOUSE_BUTTON);
    await sleep(500);
    const menuOriginLoc = await canvas.findByText("Original location");
    await userEvent.click(menuOriginLoc);
  },
};
