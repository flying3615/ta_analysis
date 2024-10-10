import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { fireEvent, userEvent, within } from "@storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import { click, getCytoCanvas, sleep, StorybookRouter } from "@/test-utils/storybook-utils";

export default {
  title: "PageLabelInput",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

type Story = StoryObj<typeof PlanSheets>;

const queryClient = new QueryClient();

const PlanSheetsTemplate = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <StorybookRouter url={generatePath(Paths.layoutPlanSheets, { transactionId: "123" })}>
          <Route path={Paths.layoutPlanSheets} element={<PlanSheets />} />
        </StorybookRouter>
      </Provider>
    </QueryClientProvider>
  );
};

export const Default: Story = {
  render: () => <PlanSheetsTemplate />,
};

export const InputLabelValidation: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Add label"));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));

    // click inside the page border shows input
    await click(target, { clientX: 800, clientY: 100 });
    await expect(await canvas.findByTestId("PageLabelInput-textarea")).toBeInTheDocument();
    // click outside the page border hides input
    await click(target, { clientX: 1270, clientY: 300 });
    await expect(canvas.queryByTestId("PageLabelInput-textarea")).not.toBeInTheDocument();
    // click inside the page border shows input
    await click(target, { clientX: 850, clientY: 500 });
    await expect(await canvas.findByTestId("PageLabelInput-textarea")).toBeInTheDocument();
    await click(target, { clientX: 1200, clientY: 670 });
    // click in the page number reserved area hides input
    await expect(canvas.queryByTestId("PageLabelInput-textarea")).not.toBeInTheDocument();
    await click(target, { clientX: 750, clientY: 680 });
    // click in the bottom text reserved area hides input
    await expect(canvas.queryByTestId("PageLabelInput-textarea")).not.toBeInTheDocument();

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

const addLabel = async (canvasElement: HTMLElement, labelPosition: { clientX: number; clientY: number }) => {
  const canvas = within(canvasElement);
  await userEvent.click(await canvas.findByTitle("Add label"));
  await sleep(500);
  const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));

  await click(target, labelPosition);
  const addLabelTextBox = canvas.getByPlaceholderText("Enter some text");
  void fireEvent.input(addLabelTextBox, { target: { value: "My page label" } });
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
    let cursorButton = (await canvas.findByTitle("Cursor")).parentElement;
    await expect(cursorButton).toHaveClass("selected");

    // add label again
    await addLabel(canvasElement, labelPosition);
    // click outside the textarea to save the label
    await click(target, { clientX: 800, clientY: 500 });
    await sleep(500);
    // plan mode changes to cursor after save
    cursorButton = (await canvas.findByTitle("Cursor")).parentElement;
    await expect(cursorButton).toHaveClass("selected");
  },
};

export const EditLabel: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Add label"));
    await sleep(500);
    let target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));

    const pageLabelPosition = { clientX: 900, clientY: 200 };
    await addLabel(canvasElement, pageLabelPosition);
    // click outside the textarea to save the label
    await click(target, { clientX: 800, clientY: 500 });
    await sleep(500);
    await userEvent.click(await canvas.findByTitle("Select Labels"));
    await sleep(500);
    target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    // click on a diagram label does not show the input
    const diagramLabelPosition = { clientX: 585, clientY: 296 };
    await click(target, diagramLabelPosition); // click to select
    await click(target, diagramLabelPosition); // click to edit
    await expect(canvas.queryByTestId("PageLabelInput-textarea")).not.toBeInTheDocument();
    // click on a page label does show the input
    await click(target, pageLabelPosition); // click to select
    await click(target, pageLabelPosition); // click to edit
    await expect(await canvas.findByTestId("PageLabelInput-textarea")).toBeInTheDocument();
    // press Escape to cancel the edit label (does not change the mode)
    await userEvent.keyboard("{escape}");
    await sleep(500);
    await expect(canvas.queryByTestId("PageLabelInput-textarea")).not.toBeInTheDocument();
    const selectLabelButton = (await canvas.findByTitle("Select Labels")).parentElement;
    await expect(selectLabelButton).toHaveClass("selected");
    // click on a page label does show the input (final screenshot)
    await click(target, pageLabelPosition); // click to select
    await click(target, pageLabelPosition); // click to edit
  },
};
