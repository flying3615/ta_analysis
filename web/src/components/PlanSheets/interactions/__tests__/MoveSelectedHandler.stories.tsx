import { Meta } from "@storybook/react";
import { fireEvent, userEvent, within } from "@storybook/testing-library";

import { Default, Story } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import {
  getCytoscapeNodeLayer,
  getCytoscapeOffsetInCanvas,
  sleep,
  tabletLandscapeParameters,
} from "@/test-utils/storybook-utils";

export default {
  title: "PlanSheets",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

export const MoveDiagramLine: Story = {
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

export const MoveDiagramNode: Story = {
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

interface MousePosition {
  clientX: number;
  clientY: number;
}

async function selectAndDrag(element: HTMLElement, from: MousePosition, to: MousePosition, numSteps = 2) {
  const positions: MousePosition[] = [from];
  const stepDx = (to.clientX - from.clientX) / numSteps;
  const stepDy = (to.clientY - from.clientY) / numSteps;
  for (let step = 1; step <= numSteps; step++) {
    positions.push({
      clientX: from.clientX + step * stepDx,
      clientY: from.clientY + step * stepDy,
    });
  }

  // click to select
  fireEvent.mouseDown(element, positions[0]);
  fireEvent.mouseUp(element, positions[0]);
  await sleep(500);

  // drag
  fireEvent.mouseDown(element, positions[0]);
  for (const position of positions) {
    fireEvent.mouseMove(element, position);
    await sleep(100);
  }
  fireEvent.mouseUp(element, positions[positions.length - 1]);
}
