import { expect } from "@storybook/jest";
import { Meta } from "@storybook/react";

import { Default, Story } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { checkCytoElementProperties, countSelected, TestCanvas } from "@/test-utils/storybook-utils";

export default {
  title: "PlanSheets/Properties/DiagramLines",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

export const HoverOverDiagramLineEndPoint: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Lines");
    await test.hoverOver([209, 421]); // hover over end-point
    // Chromatic to check that an indicator is visible
  },
};

export const ClickDiagramLineEndPoints: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Lines");
    await test.leftClick([209, 421]); // click first end-point
    await test.leftClick([130, 417]); // click second end-point
    await expect(await countSelected()).toBe(1);
    // Chromatic to check that only the second end-point is selected
  },
};

export const DragDiagramLineMidPoint: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Lines");
    await test.leftClick([161, 405]); // click point
    await test.leftClickAndDrag([161, 405], [200, 300]); // drag point
    await checkCytoElementProperties("node[id='30008']", { position: { x: 200, y: 300 } });
    // Chromatic to check that an indicator is visible
  },
};

export const DragDiagramLineEndPoint: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Lines");
    await test.leftClick([129, 417]); // click point - TODO: skip when possible
    await test.leftClickAndDrag([129, 417], [200, 300]); // drag point
    await checkCytoElementProperties("node[id='30007']", { position: { x: 203, y: 300 } });
    // Chromatic to check that an indicator is visible
  },
};
