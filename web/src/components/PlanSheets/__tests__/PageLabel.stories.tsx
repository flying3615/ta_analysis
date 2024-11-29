import { expect } from "@storybook/jest";
import { Meta } from "@storybook/react";
import { fireEvent, userEvent, within } from "@storybook/test";
import { NodeSingular } from "cytoscape";

import { Default, Story } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import {
  checkCytoElementProperties,
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
  title: "PlanSheets/PageLabel",
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

export const NewLabelTakesLastSetStyle: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.contextMenu({ at: [586, 111] /* Rotated user added text */, select: "Properties" });
    await userEvent.selectOptions(test.findProperty("Select", "Font"), "Tinos (was Times New Roman)");
    await userEvent.selectOptions(test.findProperty("Select", "Size(pts)"), "8");
    await test.clickButton("OK");

    await addLabel(canvasElement, test.toClientXY([280, 56] /* Some random white space */), "xxx");
    await test.clickTitle("Select Labels");
    await test.contextMenu({ at: [280, 56] /* the newly added label */, select: "Properties" });
    await expect(test.findProperty("Select", "Font")).toHaveDisplayValue("Tinos (was Times New Roman)");
    await expect(test.findProperty("Select", "Size(pts)")).toHaveDisplayValue("8");
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

    // select two page labels and one diagram label
    clickMultipleCoordinates(target, [toXY(pageLabelPosition), toXY(pageLabel2Position), toXY(diagramLabel2Position)]);

    // right click on diagram label, context menu shows delete menu disabled
    clickAtCoordinates(target, diagramLabel2Position, RIGHT_MOUSE_BUTTON);
    await expect(await canvas.findByRole("menuitem", { name: "Delete" })).toHaveAttribute("aria-disabled", "true");
    await userEvent.keyboard("{Escape}"); // close context menu

    // escape deselects - reselect two page labels and one diagram label
    clickMultipleCoordinates(target, [toXY(pageLabelPosition), toXY(pageLabel2Position), toXY(diagramLabel2Position)]);
    await userEvent.keyboard("{Delete}");
    await sleep(500); // required, in case objects get deleted later
    // delete the selected labels, only page label deleted and diagram label remains
    // When SURVEY-26060 is implemented, all labels will remain. For now, only chromatic baseline will change
    // TODO: SURVEY-26060 check cytoscape objects still exist
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
    await test.waitForCytoscape();
    // chomatic checks that the label has been removed
  },
};

export const PageLabelUndoCut: Story = {
  ...Default,
  play: async (context) => {
    await CutPageLabelDoesRemove.play?.(context);
    const test = await TestCanvas.Create(context.canvasElement, "Undo");
    await test.waitForCytoscape();
    const labels = window.cyRef.$('node[label = "Rotated user added text"]') as unknown as NodeSingular[];
    await expect(labels.length).toBe(1);
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
    await sleep(1500);
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
    await sleep(2000);
    // chromatic should now see 9 page labels while there was just one
    const labels = window.cyRef.$('node[label = "Rotated user added text"]') as unknown as NodeSingular[];
    await expect(labels.length).toBe(9);
    const newLabels = labels.slice(1); // remove the original label from the Collection
    // assert ids of new labels
    newLabels.forEach((label, index) => {
      void expect(label.id()).toBe(`LAB_${index + 3}`); // since maxId for element Label was 2, the first pasted label will have id 3
    });
  },
};

export const PageLabelUndoMultiSelectCopyPaste: Story = {
  ...Default,
  play: async (context) => {
    await PageLabelMultiSelectCopyPaste.play?.(context);
    const test = await TestCanvas.Create(context.canvasElement, "Undo");
    await test.waitForCytoscape();
    const labels = window.cyRef.$('node[label = "Rotated user added text"]') as unknown as NodeSingular[];
    await expect(labels.length).toBe(6);
  },
};

export const PageLabelMultiSelectCutUndoPaste: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.contextMenu({ at: [585, 113] /* page label */, select: "Copy" });
    await test.contextMenu({ at: [585, 213] /* whitespace */, select: "Paste" });
    await test.contextMenu({ at: [585, 213] /* copied page label */, select: "Properties" });
    await expect(test.findProperty("Select", "Font")).toHaveDisplayValue("Roboto (was Tahoma)");
    await expect(test.findProperty("Select", "Size(pts)")).toHaveDisplayValue("14");
    await test.clickButton("Cancel");
    await test.click([585, 313]);
    await test.contextMenu({ at: [585, 313] /* other white space */, select: "Paste" });
    await test.multiSelect([
      [585, 113],
      [585, 213],
      [585, 313],
    ]);
    await test.contextMenu({ at: [585, 213], select: "Cut" });
    await test.clickTitle("Undo");
    await test.contextMenu({ at: [385, 213], select: "Paste" });
    await test.clickTitle("Undo");
    await test.contextMenu({ at: [185, 213], select: "Paste" });
    await test.waitForCytoscape();
    const labels = window.cyRef.$('node[label = "Rotated user added text"]') as unknown as NodeSingular[];
    await expect(labels.map((label, _) => label.id())).toEqual([
      "LAB_23",
      "LAB_3",
      "LAB_4",
      "LAB_8",
      "LAB_9",
      "LAB_10",
    ]);
  },
};

// Enforces 'play' is provided as it is used in PlanSheetsUndo
export const MovePageAndDiagramLabels: Story & Required<Pick<Story, "play">> = {
  ...Default,
  play: async ({ canvasElement }) => {
    const diagramLabelOriginalLocation: [number, number] = [213.1, 213.1];
    const diagramLabelNewLocation: [number, number] = [348.24, 450.02];
    const pageLabelOriginalLocation: [number, number] = [591.19, 110.23];
    const pageLabelNewLocation: [number, number] = [726.32, 347.15];
    const test = await TestCanvas.Create(canvasElement, "Select Labels");

    // verify the original positions of the labels
    await checkCytoElementProperties("#LAB_14" /* diagram label */, {
      position: { x: diagramLabelOriginalLocation[0], y: diagramLabelOriginalLocation[1] },
    });
    await checkCytoElementProperties("#LAB_23" /* page label */, {
      position: { x: pageLabelOriginalLocation[0], y: pageLabelOriginalLocation[1] },
    });

    await test.multiSelect([diagramLabelOriginalLocation, pageLabelOriginalLocation]);
    await test.leftClickAndDrag(diagramLabelOriginalLocation, diagramLabelNewLocation);
    await test.waitForCytoscape();

    // verify the new positions of the labels
    await checkCytoElementProperties("#LAB_14" /* diagram label */, {
      position: { x: diagramLabelNewLocation[0], y: diagramLabelNewLocation[1] },
    });
    await checkCytoElementProperties("#LAB_23" /* page label */, {
      position: { x: pageLabelNewLocation[0], y: pageLabelNewLocation[1] },
    });
  },
};
