import { expect } from "@storybook/jest";
import { Meta } from "@storybook/react";
import { fireEvent, userEvent, within } from "@storybook/test";

import { Default, Story } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import {
  click,
  clickAtCoordinates,
  clickMultipleCoordinates,
  getCytoCanvas,
  RIGHT_MOUSE_BUTTON,
  sleep,
  tabletLandscapeParameters,
  TestCanvas,
  toClientXY,
  toXY,
} from "@/test-utils/storybook-utils";

export default {
  title: "PageLabel",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

const diagramLabel2Position: [number, number] = [490, 270];
const pageLabelPosition: [number, number] = [900, 200];
const pageLabel2Position: [number, number] = [800, 300];
const whiteSpace: [number, number] = [585, 296 + 30];

const addLabel = async (
  canvasElement: HTMLElement,
  labelPosition: { clientX: number; clientY: number },
  labelText: string = "My Page Label",
) => {
  const canvas = within(canvasElement);
  await userEvent.click(await canvas.findByTitle(PlanMode.AddLabel));
  await sleep(500);
  const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));

  await click(target, labelPosition);
  const addLabelTextBox = canvas.getByPlaceholderText("Enter some text");
  void fireEvent.input(addLabelTextBox, { target: { value: labelText } });
};

export const HoverLabel: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.hoverOver([586, 111] /* Rotated user added text */);
    // label turns blue
  },
};

export const DeselectLabel: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.leftClick([586, 111] /* Rotated user added text */);
    await test.leftClick(whiteSpace); // label is deselected
  },
};

export const SelectMultipleLabels: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.click([210, 214] /* Label 14 */, true);
    await test.click([146, 246] /* Label 13 */, true);
  },
};

export const DeselectMultipleLabels: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.click([210, 214] /* Label 14 */, true);
    await test.click([146, 246] /* Label 13 */, true);
    await test.click(whiteSpace); // label is deselected
  },
};

export const DeletePageLabel: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    // setup - add a page label
    const canvas = within(canvasElement);
    await addPageLabel(canvasElement, toClientXY(pageLabelPosition), "My page label");

    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));

    // right click on diagram label, context menu shows delete menu disabled
    clickAtCoordinates(target, diagramLabel2Position, RIGHT_MOUSE_BUTTON);
    await expect(await canvas.findByRole("menuitem", { name: "Delete" })).toHaveAttribute("aria-disabled", "true");

    // delete the page label
    clickAtCoordinates(target, pageLabelPosition, RIGHT_MOUSE_BUTTON);
    await userEvent.click(await canvas.findByRole("menuitem", { name: "Delete" }));
    await sleep(500);
  },
};

export const DeleteMultiplePageLabels: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    // setup - add a page label
    const canvas = within(canvasElement);
    await addPageLabel(canvasElement, toClientXY(pageLabelPosition), "My page label 1");
    await addPageLabel(canvasElement, toClientXY(pageLabel2Position), "My page label 2");

    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));

    // select two page label and one diagram label
    clickMultipleCoordinates(target, [toXY(pageLabelPosition), toXY(pageLabel2Position), toXY(diagramLabel2Position)]);
    // right click on diagram label, context menu shows delete menu disabled
    clickAtCoordinates(target, diagramLabel2Position, RIGHT_MOUSE_BUTTON);
    await expect(await canvas.findByRole("menuitem", { name: "Delete" })).toHaveAttribute("aria-disabled", "true");

    await userEvent.keyboard("{Escape}"); // close context menu
    await userEvent.keyboard("{Delete}"); // delete the selected labels, only page label deleted and diagram label remains
    await sleep(500);
  },
};

const addPageLabel = async (
  canvasElement: HTMLElement,
  labelPosition: { clientX: number; clientY: number },
  pageLabel: string,
) => {
  const canvas = within(canvasElement);
  await sleep(500);
  await userEvent.click(await canvas.findByTitle(PlanMode.AddLabel));
  await sleep(500);
  const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
  await addLabel(canvasElement, labelPosition, pageLabel);
  await click(target, { clientX: whiteSpace[0], clientY: whiteSpace[1] }); // click outside the textarea to save the label
  await sleep(500);
};

export const CopyPageLabelDoesNotRemove: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.contextMenu({ at: [585, 113] /* page label */, select: "Copy" }, "hover");
    await expect(await test.findMenuItem("Cut")).toHaveAttribute("aria-disabled", "false");
    await expect(await test.findMenuItem("Copy")).toHaveAttribute("aria-disabled", "false");
    await expect(await test.findMenuItem("Paste")).toHaveAttribute("aria-disabled", "true");
    (await test.findMenuItem("Copy")).click();
    // chomatic checks that nothing has changed
  },
};

export const CutPageLabelDoesRemove: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.contextMenu({ at: [585, 113] /* page label */, select: "Cut" });
    // chomatic checks that the line has been removed
  },
};

export const PageLabelEmptyClipboardPasteIsDisabled: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.contextMenu({ at: whiteSpace, select: "" });
    await expect(await test.findMenuItem("Paste")).toHaveAttribute("aria-disabled", "true");
  },
};

export const MultiLabelTypeClipboardEditIsDisabled: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.multiSelect([
      [585, 113] /* page label */,
      [318, 162] /* Diagram label */,
    ]);
    await test.contextMenu({ at: whiteSpace, select: "" });
    await expect(await test.findMenuItem("Cut")).toHaveAttribute("aria-disabled", "true");
    await expect(await test.findMenuItem("Copy")).toHaveAttribute("aria-disabled", "true");
    await expect(await test.findMenuItem("Paste")).toHaveAttribute("aria-disabled", "true");
  },
};

export const EmptyClipboardNoSelectionEditIsDisabled: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement);
    await test.contextMenu({ at: whiteSpace, select: "" });
    await expect(await test.findMenuItem("Cut")).toHaveAttribute("aria-disabled", "true");
    await expect(await test.findMenuItem("Copy")).toHaveAttribute("aria-disabled", "true");
    await expect(await test.findMenuItem("Paste")).toHaveAttribute("aria-disabled", "true");
  },
};

export const PageLabelMultiSelectCopyPaste: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.contextMenu({ at: [585, 113] /* page label */, select: "Copy" });
    await test.contextMenu({ at: [585, 213] /* whitespace */, select: "Paste" });
    await test.contextMenu({ at: [585, 313] /* other white space */, select: "Paste" });
    await test.multiSelect([
      [585, 113],
      [585, 213],
      [585, 313],
    ]);
    await test.contextMenu({ at: [585, 213], select: "Copy" });
    await test.contextMenu({ at: [385, 213], select: "Paste" });
    await test.contextMenu({ at: [185, 213], select: "Paste" });
  },
  // chromatic should now see 9 page labels while there was just one
};
