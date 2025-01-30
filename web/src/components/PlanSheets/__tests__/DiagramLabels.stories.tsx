import { expect } from "@storybook/jest";
import { Meta } from "@storybook/react";
import { fireEvent, screen, waitFor, within } from "@storybook/testing-library";

import { Default, Story } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import {
  checkCytoElementProperties,
  pressEscapeKey,
  tabletLandscapeParameters,
  TestCanvas,
} from "@/test-utils/storybook-utils";

export default {
  title: "DiagramLabels",
  ...Default,
} as Meta<typeof PlanSheets>;

export const AlignLabelAtEdgeToLine: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");

    await test.leftClick([140, 240]); // select Label 13
    await test.leftClickAndDrag([140, 240], [30, 240]); // Move to edge
    await test.contextMenu({ at: [30, 240], select: "Align label to line" });
    await test.leftClick([550, 231] /* A horizontal line */, "layer0-selectbox");
    await checkCytoElementProperties(
      '[label = "Label 13"]' /* page label */,
      {
        position: { x: 34, y: 239 }, // will need updating when pushed back from the boundary
      },
      "truncated",
    );
    // What we want to see is:
    // - Label 13 is horizontal
    // - Label 13 is pushed inside the boundary
  },
};

export const RotateDiagramLabel: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await checkCytoElementProperties("#LAB_14", { textRotation: 0 });
    await test.contextMenu({ at: [213, 213], select: "Rotate label" }, "hover");

    const rangeInput = await within(canvasElement).findByRole("slider");
    fireEvent.change(rangeInput, { target: { value: 50 } });
    fireEvent.focusOut(rangeInput);
    pressEscapeKey(canvasElement);
    await checkCytoElementProperties("#LAB_14", { textRotation: 40 });
  },
};

export const RotateDiagramLabelAtEdge: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");

    await test.contextMenu({ at: [213, 213], select: "Rotate label" }, "hover");
    let rangeInput = await within(canvasElement).findByRole("slider");
    fireEvent.change(rangeInput, { target: { value: 7 } });
    fireEvent.focusOut(rangeInput);

    await test.clickButton("Select Labels");
    await test.click([213, 213]);
    await test.leftClickAndDrag([213, 213], [960, 213]);

    await test.contextMenu({ at: [960, 213], select: "Rotate label" }, "hover");
    rangeInput = await within(canvasElement).findByRole("slider");
    fireEvent.change(rangeInput, { target: { value: 90 } });
    fireEvent.focusOut(rangeInput);
    await test.clickButton("Select Labels");
    await checkCytoElementProperties(
      '[label = "Label 14"]' /* page label */,
      {
        position: { x: 937, y: 213 }, // Label is pushed back from the boundary
      },
      "truncated",
    );
    // chromatic should show Label 14 pushed back within the boundary
  },
};

export const RotateDiagramLabelProperties: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    async function isnotIs(isnot: string | number, is: string | number) {
      fireEvent.change(angleField, { target: { value: isnot } });
      await expect(await screen.findByText("Must be a number in D.MMSS format")).toBeVisible();
      await waitFor(() => expect(screen.getByRole("button", { name: "OK" })).toBeDisabled());

      fireEvent.change(angleField, { target: { value: is } });
      await waitFor(() => expect(screen.queryByText("Must be a number in D.MMSS format")).not.toBeInTheDocument());
      await waitFor(() => expect(screen.getByRole("button", { name: "OK" })).toBeEnabled());
    }

    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.contextMenu({ at: [213, 213], select: "Rotate label" });

    const rangeInput = await within(canvasElement).findByRole("slider");
    fireEvent.change(rangeInput, { target: { value: 50 } });
    fireEvent.focusOut(rangeInput);
    await test.contextMenu({ at: [213, 213], select: "Properties" });
    const angleField = test.findProperty("TextInput", "Text angle (degrees)");
    await isnotIs(123.6, 123.4);
    await isnotIs(123.596, 123.59);
    await isnotIs("123.00000", "123.0000");
    await isnotIs(123.59596, 123.5959);
    screen.getByRole("button", { name: "OK" }).click();
    // Chromatic to check angle of text
  },
};
