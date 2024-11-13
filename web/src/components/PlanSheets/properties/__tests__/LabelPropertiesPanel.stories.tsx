import { PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { fireEvent, userEvent, within } from "@storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { handlers } from "@/mocks/mockHandlers";
import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import {
  click,
  clickAtPosition,
  clickMultipleCoordinates,
  getCytoCanvas,
  ModalStoryWrapper,
  RIGHT_MOUSE_BUTTON,
  sleep,
  StorybookRouter,
} from "@/test-utils/storybook-utils";

import {
  diagramLabelObsBearingHide,
  diagramLabelObsBearingSuppressSeconds,
  diagramLabelParcelAppellation,
  diagramLabelSystemDisplay,
  pageLabelWithBorder,
  pageLabelWithLineBreak,
} from "./data/LabelsData";

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
const pageLabelWithLineBreakPosition = { clientX: 802, clientY: 478 };
const hiddenDiagramLabelPosition = { clientX: 475, clientY: 344 };
const hiddenPageLabelPosition = { clientX: 695, clientY: 589 };
const diagramLabelSystemDisplayPosition = { clientX: 788, clientY: 89 };

export const Default: Story = {
  render: () => <PlanSheetsTemplate />,
};

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
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickAtPosition(target, diagramLabelPosition, RIGHT_MOUSE_BUTTON);
    await sleep(500);
    const rotateLabelMenuItem = await canvas.findByText("Rotate label");
    await userEvent.hover(rotateLabelMenuItem);
    await expect(canvas.getByRole("slider")).toHaveValue("90");
    const propertiesMenuItem = await canvas.findByText("Properties");
    await userEvent.click(propertiesMenuItem);
    await sleep(500);
    await expect(await canvas.findByDisplayValue("90.0000")).toBeInTheDocument();
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
    const fontInput = await canvas.findByDisplayValue("Tahoma");
    await userEvent.selectOptions(fontInput, "Arial");
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
    clickAtPosition(target, pageLabelPosition, RIGHT_MOUSE_BUTTON);
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

const customMockPlanData = JSON.parse(JSON.stringify(mockPlanData)) as PlanResponseDTO;
if (customMockPlanData.pages[0]) {
  customMockPlanData.pages[0].labels = [
    ...(customMockPlanData.pages[0].labels ?? []),
    pageLabelWithLineBreak,
    pageLabelWithBorder,
  ];
}
if (customMockPlanData.diagrams[0]?.lineLabels?.[0]) {
  customMockPlanData.diagrams[0].lineLabels = [
    ...customMockPlanData.diagrams[0].lineLabels,
    diagramLabelParcelAppellation,
    diagramLabelObsBearingHide,
    diagramLabelObsBearingSuppressSeconds,
    diagramLabelSystemDisplay,
  ];
}

export const CustomLabels: Story = {
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

export const HidePageAndDiagramLabelsBothInDisplayState: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickMultipleCoordinates(target, [
      { x: pageLabelWithLineBreakPosition.clientX, y: pageLabelWithLineBreakPosition.clientY },
      { x: diagramLabelPosition.clientX, y: diagramLabelPosition.clientY },
    ]);
    clickAtPosition(target, diagramLabelPosition, RIGHT_MOUSE_BUTTON);
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    const hideButton = await within(contextMenu).findByText("Hide");
    await userEvent.click(hideButton); // final screenshot verify labels hidden
    await sleep(500);
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
  },
};

export const ShowPageLabelInHideStateAndDiagramLabelInDisplayState: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickMultipleCoordinates(target, [
      { x: diagramLabelPosition.clientX, y: diagramLabelPosition.clientY },
      { x: hiddenPageLabelPosition.clientX, y: hiddenPageLabelPosition.clientY },
    ]);
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickMultipleCoordinates(target, [
      { x: pageLabelWithLineBreakPosition.clientX, y: pageLabelWithLineBreakPosition.clientY },
      { x: diagramLabelPosition.clientX, y: diagramLabelPosition.clientY },
    ]);
    clickAtPosition(target, diagramLabelPosition, RIGHT_MOUSE_BUTTON);
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    const hideButton = await within(contextMenu).findByText("Hide");
    await userEvent.click(hideButton); // changes rendered
    await sleep(500);
    await userEvent.click(await canvas.findByTitle(PlanMode.Undo));
    await sleep(500); // final screenshot verify changes undone
    await expect(await canvas.findByRole("button", { name: "Undo" })).toBeDisabled();
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
