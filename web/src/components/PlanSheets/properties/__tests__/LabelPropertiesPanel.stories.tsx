import { expect } from "@storybook/jest";
import { Meta } from "@storybook/react";
import { fireEvent, screen, userEvent, within } from "@storybook/test";

import { CustomLabels } from "@/components/PlanSheets/__tests__/PageLabel.stories";
import { Default, Story } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import {
  checkCytoElementProperties,
  click,
  clickAtPosition,
  clickMultipleCoordinates,
  countSelected,
  getCytoCanvas,
  RIGHT_MOUSE_BUTTON,
  sleep,
  TestCanvas,
  toXY,
} from "@/test-utils/storybook-utils";

export default {
  title: "PlanSheets/Properties/LabelPropertiesPanel",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

const pageLabelPosition = { clientX: 900, clientY: 200 };
const diagramLabelPosition = { clientX: 484, clientY: 269 };
const whiteSpace = { clientX: 585, clientY: 300 };
const pageLabelWithLineBreakPosition = { clientX: 802, clientY: 478 };
const hiddenDiagramLabelPosition = { clientX: 475, clientY: 344 };
const hiddenPageLabelPosition = { clientX: 695, clientY: 589 };
const diagramLabelSystemDisplayPosition = { clientX: 788, clientY: 89 };

export const ShowLabelContextMenu: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickAtPosition(target, diagramLabelPosition, RIGHT_MOUSE_BUTTON); // screenshot verify context menu
  },
};

export const ShowLabelPropertiesPanel: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickAtPosition(target, diagramLabelPosition, RIGHT_MOUSE_BUTTON);
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    const propertiesButton = await within(contextMenu).findByText("Properties");
    await userEvent.click(propertiesButton);
    await sleep(500);
  },
};

export const RotateLabelSliderAndPropertiesTextAngleAreConsistent: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.contextMenu({ at: [204, 213], select: "Rotate label" }, "hover");
    await expect(within(test.canvasElement).getByRole("slider")).toHaveValue("90");
    await test.contextMenu({ at: [204, 213], select: "Properties" });
    await sleep(500);
    await expect(test.findProperty("TextInput", "Text angle (degrees)").getAttribute("value")).toBe("90.0000");
    await expect(await countSelected()).toBe(1);
  },
};

export const UpdatePageLabelProperties: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // setup - add page label
    await addPageLabel(canvasElement, pageLabelPosition, "My Page Label\nSecond Line");
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickAtPosition(target, pageLabelPosition, RIGHT_MOUSE_BUTTON);
    await sleep(500);
    await expect(await countSelected()).toBe(1);

    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    const propertiesButton = await within(contextMenu).findByText("Properties");
    await userEvent.click(propertiesButton);
    await sleep(500);
    const okButton = canvas.getByRole("button", { name: "OK" });
    await expect(okButton).toBeDisabled();
    const boldCheckbox = await canvas.findByLabelText("Bold");
    await userEvent.click(boldCheckbox);
    const textInput = await canvas.findByTestId("label-textarea");
    await userEvent.click(textInput);
    await userEvent.keyboard("{delete}"); // pressing delete should NOT delete the label (verified by chromatic)
    void fireEvent.input(textInput, { target: { value: "New Label\nNew Line" } });
    const fontInput = await canvas.findByDisplayValue("Roboto (was Tahoma)");
    await userEvent.selectOptions(fontInput, "Arimo (was Arial)");
    const fontSizeInput = await canvas.findByDisplayValue("14");
    await userEvent.selectOptions(fontSizeInput, "16");
    const textAngleInput = await canvas.findByDisplayValue("90.0000");
    void fireEvent.input(textAngleInput, { target: { value: "200" } });
    await canvas.findByText("Must be between 0 and 180 degrees");
    await userEvent.clear(textAngleInput);
    void fireEvent.input(textAngleInput, { target: { value: "111.12345" } });
    await canvas.findByText("Must be a number in D.MMSS format");
    await userEvent.clear(textAngleInput);
    void fireEvent.input(textAngleInput, { target: { value: "45" } });
    const rightAlignButton = await canvas.findByRole("button", { name: "Right" });
    await userEvent.click(rightAlignButton);
    const borderCheckbox = await canvas.findByLabelText("Border");
    await userEvent.click(borderCheckbox);
    await expect(okButton).toBeEnabled();
    await userEvent.click(okButton); // final screenshot verify changes rendered
    await sleep(500);
    await expect(await countSelected()).toBe(1);
  },
};

export const UpdateDiagramLabelProperties: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickAtPosition(target, diagramLabelPosition, RIGHT_MOUSE_BUTTON);
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    const propertiesButton = await within(contextMenu).findByText("Properties");
    await userEvent.click(propertiesButton);
    await sleep(500);
    const okButton = canvas.getByRole("button", { name: "OK" });
    await expect(okButton).toBeDisabled();
    const boldCheckbox = await canvas.findByLabelText("Bold");
    await userEvent.click(boldCheckbox);
    const fontInput = await canvas.findByDisplayValue("Roboto (was Tahoma)");
    await userEvent.selectOptions(fontInput, "Arimo (was Arial)");
    const fontSizeInput = await canvas.findByDisplayValue("16");
    await userEvent.selectOptions(fontSizeInput, "14");
    const textAngleInput = await canvas.findByDisplayValue("90.0000");
    void fireEvent.input(textAngleInput, { target: { value: "200" } });
    await canvas.findByText("Must be between 0 and 180 degrees");
    await userEvent.clear(textAngleInput);
    void fireEvent.input(textAngleInput, { target: { value: "111.12345" } });
    await canvas.findByText("Must be a number in D.MMSS format");
    await userEvent.clear(textAngleInput);
    void fireEvent.input(textAngleInput, { target: { value: "45" } });
    const borderCheckbox = await canvas.findByLabelText("Border");
    await userEvent.click(borderCheckbox);
    await expect(okButton).toBeEnabled();
    await userEvent.click(okButton); // final screenshot verify changes rendered
    await sleep(500);
    await expect(await countSelected()).toBe(1);
  },
};

export const UpdateLabelPropertiesAtEdge: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    let labelPosition: [number, number] = [588, 109];
    await test.leftClick(labelPosition);
    await test.contextMenu({ at: labelPosition, select: "Properties" });
    await userEvent.selectOptions(test.findProperty("Select", "Size(pts)"), "8");
    await test.clickButton("OK");
    await test.leftClick(labelPosition);
    await test.leftClickAndDrag(labelPosition, (labelPosition = [936, 109]));

    await test.leftClick(labelPosition);
    await test.contextMenu({ at: labelPosition, select: "Properties" });
    await userEvent.selectOptions(test.findProperty("Select", "Size(pts)"), "14");
    await test.clickButton("OK");
    await checkCytoElementProperties(
      "#LAB_23" /* page label */,
      {
        position: { x: 934, y: 110 }, // will need updating when pushed back from the boundary
      },
      "truncated",
    );
  },
};

export const UpdateLabelPropertiesCancelFlow: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickAtPosition(target, diagramLabelPosition, RIGHT_MOUSE_BUTTON);
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    const propertiesButton = await within(contextMenu).findByText("Properties");
    await userEvent.click(propertiesButton);
    await sleep(500);
    const borderCheckbox = await canvas.findByLabelText("Border");
    await userEvent.click(borderCheckbox);
    const cancelButton = canvas.getByRole("button", { name: "Cancel" });
    await userEvent.click(cancelButton); // final screenshot verify changes not rendered
    await sleep(500);
    await expect(await canvas.findByRole("button", { name: "Undo" })).toBeDisabled();
    await expect(await countSelected()).toBe(1);
  },
};

export const UpdateMultiplePageAndDiagramLabelProperties: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // setup - add page label
    await addPageLabel(canvasElement, pageLabelPosition, "My Page Label\nSecond Line");
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickMultipleCoordinates(target, [
      { x: pageLabelPosition.clientX, y: pageLabelPosition.clientY },
      { x: diagramLabelPosition.clientX, y: diagramLabelPosition.clientY },
    ]);
    clickAtPosition(target, pageLabelPosition, RIGHT_MOUSE_BUTTON);
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    const propertiesButton = await within(contextMenu).findByText("Properties");
    await userEvent.click(propertiesButton);
    await sleep(500);
    const okButton = canvas.getByRole("button", { name: "OK" });
    await expect(okButton).toBeDisabled();
    const boldCheckbox = await canvas.findByLabelText("Bold");
    await userEvent.click(boldCheckbox);
    const fontInput = await canvas.findByDisplayValue("Roboto (was Tahoma)");
    await userEvent.selectOptions(fontInput, "Arimo (was Arial)");
    const borderCheckbox = await canvas.findByLabelText("Border");
    await userEvent.click(borderCheckbox);
    await expect(okButton).toBeEnabled();
    await userEvent.click(okButton); // final screenshot verify changes rendered
    await sleep(500);
    await expect(await countSelected()).toBe(2);
  },
};

export const UpdateMultiplePageAndDiagramLabelPropertiesAndUndo: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // setup - add page label
    await addPageLabel(canvasElement, pageLabelPosition, "My Page Label\nSecond Line");
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickMultipleCoordinates(target, [
      { x: pageLabelPosition.clientX, y: pageLabelPosition.clientY },
      { x: diagramLabelPosition.clientX, y: diagramLabelPosition.clientY },
    ]);
    clickAtPosition(target, whiteSpace, RIGHT_MOUSE_BUTTON); // specifically not a selected object
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    const propertiesButton = await within(contextMenu).findByText("Properties");
    await userEvent.click(propertiesButton);
    await sleep(500);
    const okButton = canvas.getByRole("button", { name: "OK" });
    await expect(okButton).toBeDisabled();
    const borderCheckbox = await canvas.findByLabelText("Border");
    await userEvent.click(borderCheckbox);
    await expect(okButton).toBeEnabled();
    await userEvent.click(okButton); // changes rendered
    await userEvent.click(await canvas.findByTitle(PlanMode.Undo)); // changes undone - final screenshot verify changes not rendered
    await sleep(500);
    await expect(await countSelected()).toBe(2);
  },
};

export const HidePageAndDiagramLabelsBothInDisplayState: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    const pageLabelWithLineBreakPosition: [number, number] = [522, 422];
    const diagramLabelPosition: [number, number] = [204, 213];
    await test.multiSelect([pageLabelWithLineBreakPosition, diagramLabelPosition]);
    await test.contextMenu({ at: diagramLabelPosition, select: "Hide" });
    await test.waitForCytoscape();
    await expect(await countSelected()).toBe(2);
  },
};

export const ShowPageAndDiagramLabelsBothInHideState: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickMultipleCoordinates(target, [
      { x: hiddenDiagramLabelPosition.clientX, y: hiddenDiagramLabelPosition.clientY },
      { x: hiddenPageLabelPosition.clientX, y: hiddenPageLabelPosition.clientY },
    ]);
    clickAtPosition(target, hiddenPageLabelPosition, RIGHT_MOUSE_BUTTON);
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    const showButton = await within(contextMenu).findByText("Show");
    await userEvent.click(showButton); // final screenshot verify labels shown
    await sleep(500);
    await expect(await countSelected()).toBe(2);
  },
};

export const ShowPageLabelInHideStateAndDiagramLabelInDisplayState: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickMultipleCoordinates(target, [toXY(diagramLabelPosition), toXY(hiddenPageLabelPosition)]);
    clickAtPosition(target, hiddenPageLabelPosition, RIGHT_MOUSE_BUTTON);
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    const showButton = await within(contextMenu).findByText("Show");
    await userEvent.click(showButton); // final screenshot verify labels shown
    await sleep(500);
  },
};

export const ShowDiagramLabelInSystemDisplayStateAndPageLabelInHideState: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickMultipleCoordinates(target, [
      { x: diagramLabelSystemDisplayPosition.clientX, y: diagramLabelSystemDisplayPosition.clientY },
      { x: hiddenPageLabelPosition.clientX, y: hiddenPageLabelPosition.clientY },
    ]);
    clickAtPosition(target, diagramLabelSystemDisplayPosition, RIGHT_MOUSE_BUTTON);
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    const showButton = await within(contextMenu).findByText("Show");
    await userEvent.click(showButton); // final screenshot verify labels shown
    await sleep(500);
  },
};

export const HidePageAndDiagramLabelsThenUndo: Story = {
  ...CustomLabels,
  play: async (context) => {
    await HidePageAndDiagramLabelsBothInDisplayState.play?.(context);
    const test = await TestCanvas.Create(context.canvasElement, "Undo");
    await test.waitForCytoscape();
    await expect(await countSelected()).toBe(2);
  },
};

export const EditPageLabelAndThenShowUnsavedDataPopup: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickAtPosition(target, pageLabelWithLineBreakPosition, RIGHT_MOUSE_BUTTON);
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    const propertiesButton = await within(contextMenu).findByText("Properties");
    await userEvent.click(propertiesButton);
    await sleep(500);
    const boldCheckbox = await canvas.findByLabelText("Bold");
    await userEvent.click(boldCheckbox);
    const okButton = canvas.getByRole("button", { name: "OK" });
    await userEvent.click(okButton);
    await sleep(500);
    await userEvent.click(await canvas.findByText("Sheets"));
    await userEvent.click(await canvas.findByText("Define Diagrams"));
    await sleep(500);
    await expect(await screen.findByText(/You have unsaved changes/)).toBeInTheDocument();
  },
};

export const RotateMultipleLabelsNearEdge: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Select Labels");
    await test.click([356, 73]); // 23°12'00, #LAB_21
    await test.leftClickAndDrag([356, 73], [356, 30]); // drag to top
    await test.multiSelect([[444, 686]]); // Page label outside layout, #LAB_512
    await test.contextMenu({ at: [356, 30], select: "Properties" });
    void fireEvent.change(test.findProperty("TextInput", "Text angle (degrees)"), { target: { value: 0 } });
    await test.clickButton("OK");
    // Confirm the labels are pushed back within the layout boundaries
    await checkCytoElementProperties("#LAB_21", { position: { x: 356.4, y: 52.6 } });
    await checkCytoElementProperties("#LAB_519", { position: { x: 469.7, y: 575.4 } });
  },
};

const addPageLabel = async (
  canvasElement: HTMLElement,
  labelPosition: { clientX: number; clientY: number },
  labelText: string,
) => {
  const canvas = within(canvasElement);
  await userEvent.click(await canvas.findByTitle(PlanMode.AddLabel));
  await sleep(500);
  const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
  await click(target, labelPosition);
  const addLabelTextBox = canvas.getByPlaceholderText("Enter some text");
  void fireEvent.input(addLabelTextBox, { target: { value: labelText } });
  await sleep(500);
  await click(target, whiteSpace); // Click outside to save the label
  await sleep(500);
};
