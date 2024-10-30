import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { fireEvent, userEvent, within } from "@storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import {
  click,
  clickAtCoordinates,
  clickMultipleCoordinates,
  getCytoCanvas,
  ModalStoryWrapper,
  RIGHT_MOUSE_BUTTON,
  sleep,
  StorybookRouter,
} from "@/test-utils/storybook-utils";

export default {
  title: "PlanSheets/Properties/LabelPropertiesPanel",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

type Story = StoryObj<typeof PlanSheets>;

const queryClient = new QueryClient();

const PlanSheetsTemplate = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ModalStoryWrapper>
          <StorybookRouter url={generatePath(Paths.layoutPlanSheets, { transactionId: "123" })}>
            <Route path={Paths.layoutPlanSheets} element={<PlanSheets />} />
          </StorybookRouter>
        </ModalStoryWrapper>
      </Provider>
    </QueryClientProvider>
  );
};

const pageLabelPosition = { clientX: 900, clientY: 200 };
const diagramLabelPosition = { clientX: 484, clientY: 269 };
const whiteSpace = { clientX: 585, clientY: 300 };

export const Default: Story = {
  render: () => <PlanSheetsTemplate />,
};

export const ShowLabelPropertiesPanel: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickAtCoordinates(target, diagramLabelPosition.clientX, diagramLabelPosition.clientY, RIGHT_MOUSE_BUTTON);
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    const propertiesButton = await within(contextMenu).findByText("Properties");
    await userEvent.click(propertiesButton);
    await sleep(500);
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
    clickAtCoordinates(target, pageLabelPosition.clientX, pageLabelPosition.clientY, RIGHT_MOUSE_BUTTON);
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    const propertiesButton = await within(contextMenu).findByText("Properties");
    await userEvent.click(propertiesButton);
    await sleep(500);
    const okButton = canvas.getByRole("button", { name: "OK" });
    await expect(okButton).toBeDisabled();
    const boldCheckbox = await canvas.findByLabelText("Bold");
    await userEvent.click(boldCheckbox);
    const textInput = await canvas.findByTestId("label-textarea");
    void fireEvent.input(textInput, { target: { value: "New Label\nNew Line" } });
    const fontInput = await canvas.findByDisplayValue("Tahoma");
    await userEvent.selectOptions(fontInput, "Arial");
    const fontSizeInput = await canvas.findByDisplayValue("14");
    await userEvent.selectOptions(fontSizeInput, "16");
    const textAngleInput = await canvas.findByDisplayValue("0");
    void fireEvent.input(textAngleInput, { target: { value: "45" } });
    const rightAlignButton = await canvas.findByRole("button", { name: "Right" });
    await userEvent.click(rightAlignButton);
    const borderCheckbox = await canvas.findByLabelText("Border");
    await userEvent.click(borderCheckbox);
    await expect(okButton).toBeEnabled();
    await userEvent.click(okButton); // final screenshot verify changes rendered
  },
};

export const UpdateLabelPropertiesCancelFlow: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickAtCoordinates(target, diagramLabelPosition.clientX, diagramLabelPosition.clientY, RIGHT_MOUSE_BUTTON);
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
    clickAtCoordinates(target, pageLabelPosition.clientX, pageLabelPosition.clientY, RIGHT_MOUSE_BUTTON);
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    const propertiesButton = await within(contextMenu).findByText("Properties");
    await userEvent.click(propertiesButton);
    await sleep(500);
    const okButton = canvas.getByRole("button", { name: "OK" });
    await expect(okButton).toBeDisabled();
    const boldCheckbox = await canvas.findByLabelText("Bold");
    await userEvent.click(boldCheckbox);
    const fontInput = await canvas.findByDisplayValue("Tahoma");
    await userEvent.selectOptions(fontInput, "Arial");
    const borderCheckbox = await canvas.findByLabelText("Border");
    await userEvent.click(borderCheckbox);
    await expect(okButton).toBeEnabled();
    await userEvent.click(okButton); // final screenshot verify changes rendered
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
    clickAtCoordinates(target, pageLabelPosition.clientX, pageLabelPosition.clientY, RIGHT_MOUSE_BUTTON);
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
