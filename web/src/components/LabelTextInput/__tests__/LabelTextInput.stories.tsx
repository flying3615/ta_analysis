import { MockUserContextProvider } from "@linz/lol-auth-js/mocks";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { fireEvent, userEvent, within } from "@storybook/test";
import { waitFor } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { singleFirmUserExtsurv1 } from "@/mocks/data/mockUsers";
import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import {
  click,
  clickAtCoordinates,
  clickMultipleCoordinates,
  getCytoCanvas,
  RIGHT_MOUSE_BUTTON,
  sleep,
  StorybookRouter,
  TestCanvas,
  toClientXY,
} from "@/test-utils/storybook-utils";

export default {
  title: "LabelTextInput",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

type Story = StoryObj<typeof PlanSheets>;

const queryClient = new QueryClient();

const PlanSheetsTemplate = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <StorybookRouter url={generatePath(Paths.layoutPlanSheets, { transactionId: "123" })}>
          <Route
            path={Paths.layoutPlanSheets}
            element={
              <MockUserContextProvider
                user={singleFirmUserExtsurv1}
                initialSelectedFirmId={singleFirmUserExtsurv1.firms[0]?.id}
              >
                <PlanSheets />
              </MockUserContextProvider>
            }
          />
        </StorybookRouter>
      </Provider>
    </QueryClientProvider>
  );
};

const diagramLabelPosition: [number, number] = [585, 296];
const diagramLabel2Position: [number, number] = [490, 270];
const pageLabelPosition: [number, number] = [900, 200];
const pageLabel2Position: [number, number] = [800, 300];
const whiteSpace: [number, number] = [585, 296 + 30];

export const Default: Story = {
  render: () => <PlanSheetsTemplate />,
};

export const InputLabelValidation: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.AddLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));

    // click inside the page border shows input
    await click(target, { clientX: 800, clientY: 100 });
    await expect(await canvas.findByTestId("LabelTextInput-textarea")).toBeInTheDocument();
    // click outside the page border hides input
    await click(target, { clientX: 1270, clientY: 300 });
    await expect(canvas.queryByTestId("LabelTextInput-textarea")).not.toBeInTheDocument();
    // click inside the page border shows input
    await click(target, { clientX: 850, clientY: 500 });
    await expect(await canvas.findByTestId("LabelTextInput-textarea")).toBeInTheDocument();
    await click(target, { clientX: 1200, clientY: 670 });
    // click in the page number reserved area hides input
    await expect(canvas.queryByTestId("LabelTextInput-textarea")).not.toBeInTheDocument();
    await click(target, { clientX: 750, clientY: 680 });
    // click in the bottom text reserved area hides input
    await expect(canvas.queryByTestId("LabelTextInput-textarea")).not.toBeInTheDocument();

    // click inside the page border shows input
    await click(target, { clientX: 1080, clientY: 450 });
    const addLabelTextBox = canvas.getByPlaceholderText("Enter some text");

    // type invalid content (using fireEvent.input as userEvent.type not triggering textarea onChange)
    void fireEvent.input(addLabelTextBox, { target: { value: "² º °" } });
    await expect(canvas.getByText("Invalid character(s) entered")).toBeInTheDocument();
    // click outside the input does not close it when there is an error
    await click(target, { clientX: 1080, clientY: 430 });
    await expect(canvas.getByText("Invalid character(s) entered")).toBeInTheDocument();
    // remove invalid content and type valid content
    await userEvent.type(addLabelTextBox, "{backspace}".repeat(5), { delay: 100 });
    void fireEvent.input(addLabelTextBox, { target: { value: "My page label" } });
    await userEvent.type(addLabelTextBox, "{enter}with line break");
    await expect(canvas.queryByText("Invalid character(s) entered")).not.toBeInTheDocument();
  },
};

export const ParcelAppellationValidation: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));

    const parcelAppellationLabelPosition = { clientX: 494, clientY: 265 };
    await click(target, parcelAppellationLabelPosition); // click to select
    await click(target, parcelAppellationLabelPosition); // click to edit
    const addLabelTextBox = canvas.getByPlaceholderText("Enter some text");
    //new lines can replace spaces and vice versa
    void fireEvent.input(addLabelTextBox, { target: { value: "Label\n14" } });
    await expect(canvas.queryByText("Appellations cannot be altered")).not.toBeInTheDocument();
    void fireEvent.input(addLabelTextBox, { target: { value: "Label 14" } });
    await expect(canvas.queryByText("Appellations cannot be altered")).not.toBeInTheDocument();
    //any other changes to the appellation are blocked and an info message shows
    void fireEvent.input(addLabelTextBox, { target: { value: "Label 14X" } });
    await expect(await canvas.findByText("Appellations cannot be altered")).toBeInTheDocument();
    await expect(canvas.getByPlaceholderText("Enter some text")).toHaveValue("Label 14");
  },
};

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

export const AddLabel: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));

    const labelPosition = { clientX: 900, clientY: 200 };
    // click on the Add Label button and show input
    await addLabel(canvasElement, labelPosition);

    // press Escape to cancel the Add Label mode
    await userEvent.keyboard("{escape}");
    await sleep(500);
    // eslint-disable-next-line testing-library/no-node-access
    let cursorButton = (await canvas.findByTitle("Cursor")).parentElement;
    await expect(cursorButton).toHaveClass("selected");

    // add label again
    await addLabel(canvasElement, labelPosition);
    // click outside the textarea to save the label
    await click(target, { clientX: 800, clientY: 500 });
    await sleep(500);
    // plan mode changes to cursor after save
    // eslint-disable-next-line testing-library/no-node-access
    cursorButton = (await canvas.findByTitle("Cursor")).parentElement;
    await expect(cursorButton).toHaveClass("selected");
  },
};

export const ShowEditLabel: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));

    const pageLabelPosition = { clientX: 873, clientY: 161 };
    const obsBearingLabelPosition = { clientX: 426, clientY: 293 };
    const parcelAppellationLabelPosition = { clientX: 494, clientY: 265 };
    // click on a page label does show the input
    await click(target, pageLabelPosition); // click to select
    await click(target, pageLabelPosition); // click to edit
    await expect(await canvas.findByTestId("LabelTextInput-textarea")).toBeInTheDocument();
    // press Escape to cancel the edit label (does not change the mode)
    await userEvent.keyboard("{escape}");
    await sleep(500);
    await waitFor(() => expect(canvas.queryByTestId("LabelTextInput-textarea")).toBeNull());
    // click on a diagram label does not show the input
    await click(target, obsBearingLabelPosition); // click to select
    await click(target, obsBearingLabelPosition); // click to edit
    await waitFor(() => expect(canvas.queryByTestId("LabelTextInput-textarea")).toBeNull());
    // click on a parcel appellation label does show the input
    await click(target, parcelAppellationLabelPosition); // click to select
    await click(target, parcelAppellationLabelPosition); // click to edit
    await expect(await canvas.findByTestId("LabelTextInput-textarea")).toBeInTheDocument();
    // press Escape to cancel the edit label (does not change the mode)
    await userEvent.keyboard("{escape}");
    await sleep(500);
    await waitFor(() => expect(canvas.queryByTestId("LabelTextInput-textarea")).toBeNull());
    //eslint-disable-next-line testing-library/no-node-access
    const selectLabelButton = (await canvas.findByTitle(PlanMode.SelectLabel)).parentElement;
    await expect(selectLabelButton).toHaveClass("selected");
  },
};

export const EditPageLabel: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    let target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));

    const pageLabelPosition = { clientX: 873, clientY: 161 };
    await click(target, pageLabelPosition); // click to select
    await click(target, pageLabelPosition); // click to edit
    const editLabelTextBox = canvas.getByPlaceholderText("Enter some text");
    void fireEvent.input(editLabelTextBox, { target: { value: "Edited my page label" } });
    await click(target, { clientX: 800, clientY: 500 });
    await sleep(500);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    // click on a page label does show the input (final screenshot)
    await click(target, pageLabelPosition); // click to select
    await click(target, pageLabelPosition); // click to edit
    await expect(await canvas.findByTestId("LabelTextInput-textarea")).toBeInTheDocument();
    await expect(canvas.getByPlaceholderText("Enter some text")).toHaveValue("Edited my page label");
  },
};

export const EditParcelAppellationLabel: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    let target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));

    const parcelAppellationLabelPosition = { clientX: 494, clientY: 265 };
    await click(target, parcelAppellationLabelPosition); // click to select
    await click(target, parcelAppellationLabelPosition); // click to edit
    const editLabelTextBox = canvas.getByPlaceholderText("Enter some text");
    void fireEvent.input(editLabelTextBox, { target: { value: "Label\n14" } });
    await click(target, { clientX: 800, clientY: 500 });
    await sleep(500);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    // click on a page label does show the input (final screenshot)
    await click(target, parcelAppellationLabelPosition); // click to select
    await click(target, parcelAppellationLabelPosition); // click to edit
    await expect(await canvas.findByTestId("LabelTextInput-textarea")).toBeInTheDocument();
    await expect(canvas.getByPlaceholderText("Enter some text")).toHaveValue("Label\n14");
  },
};

export const PreventShowingInputLabelWhenControlKeyPressed: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);
    await user.click(await canvas.findByTitle(PlanMode.AddLabel));
    await sleep(500);
    let target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    const diagramLabelPosition = { clientX: 585, clientY: 296 };
    const pageLabelPosition = { clientX: 900, clientY: 200 };
    await addLabel(canvasElement, pageLabelPosition);
    // click outside the textarea to save the label
    await click(target, { clientX: 800, clientY: 500 });
    await sleep(500);
    await user.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    // press and hold control key to multi-select page label and diagram label
    await user.keyboard("{Control>}"); // press and hold control key
    await user.pointer({
      keys: "[MouseLeft]",
      target: target,
      coords: diagramLabelPosition,
    });
    await user.pointer({
      keys: "[MouseLeft]",
      target: target,
      coords: pageLabelPosition,
    });
    // When multiple labels selected and control key is pressed,
    // selecting page label does not open Page label input
    await user.pointer({
      keys: "[MouseLeft]",
      target: target,
      coords: pageLabelPosition,
    });
    await expect(canvas.queryByTestId("LabelTextInput-textarea")).not.toBeInTheDocument();
    // select page label again to have multiple selected labels
    await user.pointer({
      keys: "[MouseLeft]",
      target: target,
      coords: pageLabelPosition,
    });
    await user.keyboard("{/Control}"); // release control key
    // When multiple labels selected and control key not pressed,
    // selecting page label opens Page label input and deselect other labels. Final screenshot
    await user.pointer({
      keys: "[MouseLeft]",
      target: target,
      coords: pageLabelPosition,
    });
    await expect(await canvas.findByTestId("LabelTextInput-textarea")).toBeInTheDocument();
  },
};

export const HoverLabel: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const target = getCytoCanvas(await within(canvasElement).findByTestId("MainCytoscapeCanvas"));
    await userEvent.pointer({ target: target, coords: toClientXY(diagramLabelPosition) }); // label turns blue
  },
};

export const DeselectLabel: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement);
    await test.leftClick(diagramLabelPosition);
    await test.leftClick(whiteSpace); // label is deselected
  },
};

export const SelectMultipleLabels: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement);
    await test.click([210, 214] /* Label 14 */, true);
    await test.click([146, 246] /* Label 13 */, true);
  },
};

export const DeselectMultipleLabels: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement);
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
    clickMultipleCoordinates(target, [
      { x: pageLabelPosition[0], y: pageLabelPosition[1] },
      { x: pageLabel2Position[0], y: pageLabel2Position[1] },
      { x: diagramLabel2Position[0], y: diagramLabel2Position[1] },
    ]);
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
