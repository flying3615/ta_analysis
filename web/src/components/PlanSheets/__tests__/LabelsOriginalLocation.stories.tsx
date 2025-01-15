import { PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { expect } from "@storybook/jest";
import { Meta } from "@storybook/react";
import { fireEvent, within } from "@storybook/testing-library";
import { http, HttpResponse } from "msw";

import { Default, Story } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { handlers } from "@/mocks/mockHandlers";
import { checkCytoElementProperties, countSelected, TestCanvas } from "@/test-utils/storybook-utils";

import { diagramObsBearingLabel, diagramObsDistLabel, pageLabelWithLineBreak } from "./data/customLabels";

export default {
  title: "PlanSheets",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

const customMockPlanData = JSON.parse(JSON.stringify(mockPlanData)) as PlanResponseDTO;
if (customMockPlanData.pages[0]) {
  customMockPlanData.pages[0].labels = [...(customMockPlanData.pages[0].labels ?? []), pageLabelWithLineBreak];
}
if (customMockPlanData.diagrams[0]?.lineLabels?.[0]) {
  customMockPlanData.diagrams[0].lineLabels = [
    ...customMockPlanData.diagrams[0].lineLabels,
    diagramObsBearingLabel,
    diagramObsDistLabel,
  ];
}

const CustomLabels: Story = {
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

export const RestoreObservationBearingDiagramLabelToOriginalLocation: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    const originalLocation: [number, number] = [373.42, 71.81];
    const moveToLocation: [number, number] = [661.9, 374.34];
    // verify the original position and rotation of the label
    // NOTE: this was unreliable and isn't part of the desired test?
    // await checkCytoElementProperties("#LAB_20", {
    //   textRotation: 0,
    //   anchorAngle: 90,
    //   pointOffset: 2,
    //   position: { x: originalLocation[0], y: originalLocation[1] },
    // });

    // move label to new position and change rotation and verify
    await moveLabelToNewPositionAndChangeRotation(test, originalLocation, moveToLocation, canvasElement, 50);
    await test.waitForCytoscape();
    await checkCytoElementProperties("#LAB_20", {
      textRotation: 40,
      anchorAngle: 90,
      pointOffset: 2,
      position: { x: moveToLocation[0] - 4, y: moveToLocation[1] + 2.3 },
    });
    await expect(await countSelected()).toBe(1);

    // restore diagram label to original position and rotation and verify
    await test.contextMenu({ at: moveToLocation, select: "Original location" });
    await test.waitForCytoscape();
    await checkCytoElementProperties("#LAB_20", {
      textRotation: 0,
      anchorAngle: 90,
      pointOffset: 2,
      position: { x: originalLocation[0], y: originalLocation[1] + 0.5 },
    });
    await expect(await countSelected()).toBe(1);
    // Chromatic snapshot verifies the restored label after moving it around
  },
};

export const RestoreObservationDistanceDiagramLabelToOriginalLocation: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    const originalLocation: [number, number] = [373.42, 87.2];
    const moveToLocation: [number, number] = [673.42, 374.55];
    // verify the original position and rotation of the label
    await checkCytoElementProperties("#LAB_21", {
      textRotation: 0,
      anchorAngle: 270,
      pointOffset: 2,
      position: { x: originalLocation[0], y: originalLocation[1] },
    });

    // move label to new position and change rotation and verify
    await moveLabelToNewPositionAndChangeRotation(test, originalLocation, moveToLocation, canvasElement, 50);
    await test.waitForCytoscape();
    await checkCytoElementProperties("#LAB_21", {
      textRotation: 40,
      anchorAngle: 270,
      pointOffset: 2,
      position: { x: moveToLocation[0] + 4, y: moveToLocation[1] - 2 },
    });
    await expect(await countSelected()).toBe(1);

    // restore diagram label to original position and rotation and verify
    await test.contextMenu({ at: moveToLocation, select: "Original location" });
    await test.waitForCytoscape();
    await checkCytoElementProperties("#LAB_21", {
      textRotation: 0,
      anchorAngle: 270,
      pointOffset: 2,
      position: { x: originalLocation[0], y: originalLocation[1] - 0.65 },
    });
    await expect(await countSelected()).toBe(1);
    // Chromatic snapshot verifies the restored label after moving it around
  },
};

export const RestoreParcelAppellationDiagramLabelToOriginalLocation: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    const originalLocation: [number, number] = [213.1, 213.1];
    const newLocation: [number, number] = [665.94, 376.44];
    // verify the original position and rotation of the label
    await checkCytoElementProperties("#LAB_14", {
      textRotation: 0,
      anchorAngle: 0,
      pointOffset: 0,
      position: { x: originalLocation[0], y: originalLocation[1] },
    });

    // move label to new position and change rotation and verify
    await moveLabelToNewPositionAndChangeRotation(test, originalLocation, newLocation, canvasElement, 50);
    await test.waitForCytoscape();
    await checkCytoElementProperties("#LAB_14", {
      textRotation: 40,
      anchorAngle: 0,
      pointOffset: 0,
      position: { x: 665.2, y: 375.87 },
    });
    await expect(await countSelected()).toBe(1);

    // restore diagram label to original position and rotation and verify
    await test.contextMenu({ at: newLocation, select: "Original location" });
    await test.waitForCytoscape();
    await checkCytoElementProperties("#LAB_14", {
      textRotation: 0,
      anchorAngle: 0,
      pointOffset: 0,
      position: { x: originalLocation[0], y: originalLocation[1] },
    });
    await expect(await countSelected()).toBe(1);
    // Chromatic snapshot verifies the restored label after moving it around
  },
};

export const RestorePageAndDiagramLabelsToOriginalLocation: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const diagramLabelOriginalLocation: [number, number] = [373.42, 71.83];
    const diagramLabelNewLocation: [number, number] = [673.6, 374.34];
    const pageLabelOriginalLocation: [number, number] = [543.09, 422.85];
    const pageLabelNewLocation: [number, number] = [750.11, 510.73];
    const test = await TestCanvas.Create(canvasElement, "Select Labels");

    // verify the original position and rotation of the labels
    await checkCytoElementProperties("#LAB_20" /* diagram label */, {
      textRotation: 0,
      anchorAngle: 90,
      pointOffset: 2,
      position: { x: diagramLabelOriginalLocation[0], y: diagramLabelOriginalLocation[1] },
    });
    await checkCytoElementProperties("#LAB_511" /* page label */, {
      textRotation: 45,
      anchorAngle: 0,
      pointOffset: 0,
      position: { x: pageLabelOriginalLocation[0], y: pageLabelOriginalLocation[1] },
    });

    // move labels to new positions and change rotation
    await moveLabelToNewPositionAndChangeRotation(
      test,
      diagramLabelOriginalLocation,
      diagramLabelNewLocation,
      canvasElement,
      50,
    );
    await moveLabelToNewPositionAndChangeRotation(
      test,
      pageLabelOriginalLocation,
      pageLabelNewLocation,
      canvasElement,
      50,
    );
    await test.waitForCytoscape();
    await checkCytoElementProperties("#LAB_20" /* diagram label */, {
      textRotation: 40,
      anchorAngle: 90,
      pointOffset: 2,
      position: { x: diagramLabelNewLocation[0] - 4, y: diagramLabelNewLocation[1] + 2 },
    });
    await checkCytoElementProperties("#LAB_511" /* page label */, {
      textRotation: 40,
      anchorAngle: 0,
      pointOffset: 0,
      position: { x: pageLabelNewLocation[0], y: pageLabelNewLocation[1] },
    });
    await expect(await countSelected()).toBe(1);

    await test.click([700, 100]);

    // restore label to original position and rotation and verify
    await test.multiSelect([diagramLabelNewLocation, pageLabelNewLocation]);
    await test.contextMenu({ at: pageLabelNewLocation, select: "Original location" });
    await test.waitForCytoscape();
    await checkCytoElementProperties("#LAB_20" /* diagram label */, {
      textRotation: 0,
      anchorAngle: 90,
      pointOffset: 2,
      position: { x: diagramLabelOriginalLocation[0], y: diagramLabelOriginalLocation[1] },
    });
    await checkCytoElementProperties("#LAB_511" /* page label */, {
      textRotation: 0,
      anchorAngle: 0,
      pointOffset: 0,
      position: { x: pageLabelOriginalLocation[0], y: pageLabelOriginalLocation[1] },
    });
    await expect(await countSelected()).toBe(2);
    // Chromatic snapshot verifies the restored labels after moving them around
  },
};

const moveLabelToNewPositionAndChangeRotation = async (
  test: TestCanvas,
  originalLocation: [number, number],
  newLocation: [number, number],
  canvasElement: HTMLElement,
  rotationAngle: number,
) => {
  await test.leftClick(originalLocation); // first select label to move
  await test.leftClickAndDrag(originalLocation, newLocation); // move label
  await test.waitForCytoscape();
  await test.contextMenu({ at: newLocation, select: "Rotate label" }, "hover");
  const rangeInput = await within(canvasElement).findByRole("slider");
  fireEvent.change(rangeInput, { target: { value: rotationAngle } });
  fireEvent.focusOut(rangeInput);
  await test.waitForCytoscape();
};
