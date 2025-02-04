import { LabelDTOLabelTypeEnum, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { Meta, StoryObj } from "@storybook/react";
import { fireEvent, userEvent } from "@storybook/test";
import { waitFor } from "@storybook/testing-library";

import CytoscapeCanvas from "@/components/CytoscapeCanvas/CytoscapeCanvas";
import { Default } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { createCustomMockPlanData, customPlanMock } from "@/test-utils/CustomMock";
import { checkCytoElementProperties, TestCanvas } from "@/test-utils/storybook-utils";

export default {
  title: "LabelsAtBorder",
  component: PlanSheets,
  parameters: {
    chromatic: { delay: 300 },
  },
} as Meta<typeof PlanSheets>;

// These tests all rely on Chromatic screen comparisons because the bounds of the labels are not easily calculated

const textAlignments = [
  "bottomCenter,textCenter",
  "bottomCenter,textRight",
  "bottomCenter",
  "bottomLeft,textCenter",
  "bottomLeft,textRight",
  "bottomLeft",
  "bottomRight,textCenter",
  "bottomRight,textRight",
  "bottomRight",
  "centerCenter,textCenter",
  "centerCenter,textRight",
  "centerCenter",
  "centerLeft,textCenter",
  "centerLeft,textRight",
  "centerLeft",
  "centerRight,textCenter",
  "centerRight,textRight",
  "centerRight",
  "topCenter,textCenter",
  "topCenter,textRight",
  "topCenter",
  "topLeft,textCenter",
  "topLeft,textRight",
  "topLeft",
  "topRight,textCenter",
  "topRight,textRight",
  "topRight",
];

function markLabel(data: PlanResponseDTO, idx: number, position: { x: number; y: number }) {
  const textAlignment = textAlignments[idx]!;
  const featureId = 10500 + idx;
  const zoomScale = data.diagrams[0]!.zoomScale;
  position = { x: position.x * zoomScale, y: position.y * zoomScale };
  data.diagrams[0]!.coordinates.push({
    id: featureId,
    coordType: "node",
    position: position,
  });
  data.diagrams[0]!.coordinateLabels.push({
    effect: "none",
    id: 555 + idx,
    labelType: LabelDTOLabelTypeEnum.markName,
    displayText: textAlignment.replace(",", "\n"),
    font: "Times New Roman",
    fontSize: 8,
    fontStyle: "boldItalic",
    position: position,
    rotationAngle: 0,
    pointOffset: 0,
    anchorAngle: 0,
    textAlignment: textAlignment,
    displayState: "display",
    borderWidth: 0.7,
    featureId: featureId,
  });
  data.diagrams[0]!.coordinateLabels.push({
    anchorAngle: 0,
    displayState: "display",
    effect: "none",
    pointOffset: 0,
    rotationAngle: 0,
    id: 10000 + idx,
    displayText: "63",
    position: position,
    labelType: "nodeSymbol1",
    font: "LOLsymbols",
    fontSize: 8,
    featureId: featureId,
    featureType: "Coordinate",
    textAlignment: "centerCenter",
  });
}

function pageLabel(data: PlanResponseDTO, idx: number, position: { x: number; y: number }) {
  const textAlignment = textAlignments[idx]!;
  if (textAlignment.includes("Left")) {
    position.x -= 0.01;
  }
  if (textAlignment.includes("top")) {
    position.y += 0.004;
  }
  data.pages[0]!.labels!.push({
    effect: "none",
    id: 555 + idx,
    labelType: LabelDTOLabelTypeEnum.userAnnotation,
    displayText: textAlignment.replace(",", "\n"),
    font: "Tahoma",
    fontSize: 8,
    fontStyle: "boldItalic",
    position: position,
    rotationAngle: 0,
    pointOffset: 0,
    anchorAngle: 0,
    textAlignment: textAlignment,
    displayState: "display",
    borderWidth: 0.7,
  });
}

async function moveToEdgeAndSelectProperties(
  test: TestCanvas,
  positionsFrom: [number, number][],
  positionsTo: [number, number][],
  endPosition: [number, number],
) {
  for (let idx = 0; idx < positionsFrom.length; idx++) {
    await test.fenceSelect(positionsFrom[idx]!, endPosition);
    await test.leftClickAndDrag(positionsFrom[idx]!, positionsTo[idx]!);
    await test.leftClick([120, 50]); // click on blank area to unselect
  }
  const allPositions = [...positionsFrom, ...positionsTo, endPosition];
  const topLeft: [number, number] = [
    Math.min(...allPositions.map((pos) => pos[0])),
    Math.min(...allPositions.map((pos) => pos[1])),
  ];
  const bottomRight: [number, number] = [
    Math.max(...allPositions.map((pos) => pos[0])),
    Math.max(...allPositions.map((pos) => pos[1])),
  ];
  await test.fenceSelect(topLeft, bottomRight);
  await test.contextMenu({ at: [120, 50], select: "Properties" });
}

export const MarkLabelsWithTextAlignmentAtLeft: StoryObj<typeof CytoscapeCanvas> = {
  ...Default,
  parameters: customPlanMock(() =>
    createCustomMockPlanData((data) => {
      for (let idx = 0, y = -0.015; idx < textAlignments.length; idx++, y -= 0.008) {
        markLabel(data, idx, { x: 0.02, y: y });
      }
    }),
  ),
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await moveToEdgeAndSelectProperties(
      test,
      [
        [95, 115],
        [83, 56],
        [63, 173],
      ],
      [
        [20, 115],
        [20, 56],
        [20, 173],
      ],
      [95, 586],
    );
    await userEvent.selectOptions(test.findProperty("Select", "Size(pts)"), "14");
    await userEvent.clear(test.findProperty("TextInput", "Text angle (degrees)"));
    await userEvent.type(test.findProperty("TextInput", "Text angle (degrees)"), "180");
    await test.clickButton("OK");

    // assert that one of the labels is at the expected position
    await waitFor(async () => {
      await checkCytoElementProperties(
        '[id = "LAB_555"]',
        {
          position: { x: 55.5, y: 62.1 },
        },
        "truncated",
      );
    });
  },
};

export const MarkLabelsWithTextAlignmentAtRight: StoryObj<typeof CytoscapeCanvas> = {
  ...Default,
  parameters: customPlanMock(() =>
    createCustomMockPlanData((data) => {
      for (let idx = 0, y = -0.015; idx < textAlignments.length; idx++, y -= 0.008) {
        markLabel(data, idx, { x: 0.37, y: y });
      }
    }),
  ),
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await moveToEdgeAndSelectProperties(
      test,
      [
        [892, 166],
        [901, 50],
        [913, 107],
      ],
      [
        [950, 166],
        [956, 50],
        [956, 107],
      ],
      [883, 586],
    );
    await userEvent.selectOptions(test.findProperty("Select", "Size(pts)"), "14");
    await userEvent.clear(test.findProperty("TextInput", "Text angle (degrees)"));
    await userEvent.type(test.findProperty("TextInput", "Text angle (degrees)"), "180");
    await test.clickButton("OK");

    // assert that one of the labels is at the expected position
    await waitFor(async () => {
      await checkCytoElementProperties(
        '[id = "LAB_579"]',
        {
          position: { x: 946.9, y: 498.3 },
        },
        "truncated",
      );
    });
  },
};

export const MarkLabelsWithTextAlignmentAtTop: StoryObj<typeof CytoscapeCanvas> = {
  ...Default,
  parameters: customPlanMock(() =>
    createCustomMockPlanData((data) => {
      for (let idx = 0, x = 0; idx < textAlignments.length; idx++, x += 0.015) {
        markLabel(data, idx, { x: x, y: 0 });
      }
    }),
  ),
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.fenceSelect([28, 28], [966, 40]);
    await test.contextMenu({ at: [29, 28], select: "Properties" });
    await userEvent.selectOptions(test.findProperty("Select", "Size(pts)"), "14");
    await userEvent.clear(test.findProperty("TextInput", "Text angle (degrees)"));
    await userEvent.type(test.findProperty("TextInput", "Text angle (degrees)"), "180");
    await test.clickButton("OK");

    // assert that one of the labels is at the expected position
    await waitFor(async () => {
      await checkCytoElementProperties(
        '[id = "LAB_555"]',
        {
          position: { x: 47.5, y: 58.4 },
        },
        "truncated",
      );
    });
  },
};

export const MarkLabelsWithTextAlignmentAtBottom: StoryObj<typeof CytoscapeCanvas> = {
  ...Default,
  parameters: customPlanMock(() =>
    createCustomMockPlanData((data) => {
      for (let idx = 0, x = 0; idx < textAlignments.length; idx++, x += 0.015) {
        markLabel(data, idx, { x: x, y: -0.245 });
      }
    }),
  ),
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.fenceSelect([28, 610], [960, 619]);
    await test.contextMenu({ at: [27, 614], select: "Properties" });
    await userEvent.selectOptions(test.findProperty("Select", "Size(pts)"), "14");
    await userEvent.clear(test.findProperty("TextInput", "Text angle (degrees)"));
    await userEvent.type(test.findProperty("TextInput", "Text angle (degrees)"), "0");
    await test.clickButton("OK");

    // assert that one of the labels is at the expected position
    await waitFor(async () => {
      await checkCytoElementProperties(
        '[id = "LAB_581"]',
        {
          position: { x: 945.9, y: 591.6 },
        },
        "truncated",
      );
    });
  },
};

export const PageLabelsWithTextAlignmentAtTop: StoryObj<typeof CytoscapeCanvas> = {
  ...Default,
  parameters: customPlanMock(() =>
    createCustomMockPlanData((data) => {
      for (let idx = 0, x = 0.028; idx < textAlignments.length; idx++, x += 0.013) {
        pageLabel(data, idx, { x: x, y: -0.021 });
      }
    }),
  ),
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.fenceSelect([28, 28], [966, 40]);
    await test.contextMenu({ at: [27, 48], select: "Properties" });
    void fireEvent.change(test.findProperty("TextInput", "Text angle (degrees)"), { target: { value: 0 } });
    await test.clickButton("OK");

    // assert that one of the labels is at the expected position
    await waitFor(async () => {
      await checkCytoElementProperties(
        '[id = "LAB_579"]',
        {
          position: { x: 813.6, y: 42.5 },
        },
        "truncated",
      );
    });
  },
};

export const PageLabelsWithTextAlignmentAtBottom: StoryObj<typeof CytoscapeCanvas> = {
  ...Default,
  parameters: customPlanMock(() =>
    createCustomMockPlanData((data) => {
      for (let idx = 0, x = 0.028; idx < textAlignments.length; idx++, x += 0.013) {
        pageLabel(data, idx, { x: x, y: -0.26 });
      }
    }),
  ),
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.fenceSelect([28, 610], [960, 619]);
    await test.contextMenu({ at: [27, 48], select: "Properties" });
    void fireEvent.change(test.findProperty("TextInput", "Text angle (degrees)"), { target: { value: 170 } });
    await test.clickButton("OK");

    // assert that one of the labels is at the expected position
    await waitFor(async () => {
      await checkCytoElementProperties(
        '[id = "LAB_570"]',
        {
          position: { x: 524.0, y: 602.4 },
        },
        "truncated",
      );
    });
  },
};

export const PageLabelsWithTextAlignmentAtLeft: StoryObj<typeof CytoscapeCanvas> = {
  ...Default,
  parameters: customPlanMock(() =>
    createCustomMockPlanData((data) => {
      for (let idx = 0, y = -0.038; idx < textAlignments.length; idx++, y -= 0.008) {
        pageLabel(data, idx, { x: 0.016, y: y });
      }
    }),
  ),
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.fenceSelect([28, 28], [30, 580]);
    await test.contextMenu({ at: [27, 48], select: "Properties" });
    await userEvent.selectOptions(test.findProperty("Select", "Size(pts)"), "14");
    await test.clickButton("OK");

    // assert that one of the labels is at the expected position
    await waitFor(async () => {
      await checkCytoElementProperties(
        '[id = "LAB_559"]',
        {
          position: { x: 55.1, y: 155.3 },
        },
        "truncated",
      );
    });
  },
};

export const PageLabelsWithTextAlignmentAtRight: StoryObj<typeof CytoscapeCanvas> = {
  ...Default,
  parameters: customPlanMock(() =>
    createCustomMockPlanData((data) => {
      for (let idx = 0, y = -0.038; idx < textAlignments.length; idx++, y -= 0.008) {
        pageLabel(data, idx, { x: 0.4, y: y });
      }
    }),
  ),
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.fenceSelect([950, 28], [966, 580]);
    await test.contextMenu({ at: [27, 48], select: "Properties" });
    await userEvent.selectOptions(test.findProperty("Select", "Size(pts)"), "14");
    void fireEvent.change(test.findProperty("TextInput", "Text angle (degrees)"), { target: { value: 0 } });
    await test.clickButton("OK");

    // assert that one of the labels is at the expected position
    await waitFor(async () => {
      await checkCytoElementProperties(
        '[id = "LAB_566"]',
        {
          position: { x: 951.9, y: 293.0 },
        },
        "truncated",
      );
    });
  },
};
