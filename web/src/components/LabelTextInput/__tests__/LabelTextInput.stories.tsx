import { expect } from "@storybook/jest";
import { Meta } from "@storybook/react";
import { fireEvent, userEvent, within } from "@storybook/test";
import { waitFor } from "@storybook/testing-library";

import { Default, Story } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import {
  checkCytoElementProperties,
  click,
  cytoClick,
  getCytoCanvas,
  sleep,
  TestCanvas,
} from "@/test-utils/storybook-utils";

export default {
  title: "LabelTextInput",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

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
    async function enter(text: string) {
      await test.click(parcelAppellationLabelPosition); // click to select
      await test.click(parcelAppellationLabelPosition); // click to edit
      const addLabelTextBox = canvas.getByPlaceholderText("Enter some text");
      await sleep(300); // wait for validation to load
      void fireEvent.input(addLabelTextBox, { target: { value: text } });
    }

    const test = await TestCanvas.Create(canvasElement, PlanMode.SelectLabel);

    const canvas = within(canvasElement);

    let parcelAppellationLabelPosition: [number, number] = [211, 211];

    //text changes to the appellation are blocked and an info message shows
    await enter("Label 14X");

    await expect(await canvas.findByText("Appellations cannot be altered")).toBeInTheDocument();
    await expect(canvas.getByPlaceholderText("Enter some text")).toHaveValue("Label 14");

    await test.click([300, 300]); // Save change

    //new lines can replace spaces
    await test.clickButton(PlanMode.SelectLabel);
    await enter("Label\n14");
    await expect(canvas.queryByText("Appellations cannot be altered")).not.toBeInTheDocument();
    await test.click([300, 300]); // Save change

    // spaces can replace new lines, and when this happens it is kept within the boundaries
    await test.clickButton(PlanMode.SelectLabel);
    await test.click(parcelAppellationLabelPosition); // click to select
    await test.leftClickAndDrag(parcelAppellationLabelPosition, (parcelAppellationLabelPosition = [960, 184]));

    await enter("Label 14");
    await expect(canvas.queryByText("Appellations cannot be altered")).not.toBeInTheDocument();
    await test.click([300, 300]); // Save change
    await test.waitForCytoscape();
    await checkCytoElementProperties(
      '[label = "Label 14"]' /* page label */,
      {
        position: { x: 948, y: 186 }, // will need updating when pushed back from the boundary
      },
      "truncated",
    );
    // Chromatic image shows Label 14 within the boundaries
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

    // press Escape to cancel the Add Label mode and plan mode changes to cursor
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
    // Add label mode keeps selected after adding a label
    // eslint-disable-next-line testing-library/no-node-access
    cursorButton = (await canvas.findByTitle("Add label")).parentElement;
    await expect(cursorButton).toHaveClass("selected");

    const label = window.cyRef.$('node[label = "My Page Label"]');
    await expect(label.id()).toBe("LAB_3");
  },
};

export const EditPageLabelByBorder: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await sleep(500);
    let target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));

    const labelPosition = { clientX: 1221, clientY: 220 };
    // click on the Add Label button and show input
    await addLabel(canvasElement, labelPosition);
    await click(target, { clientX: 800, clientY: 500 });
    await sleep(500);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    // click on a page label does show the input (final screenshot)
    await click(target, labelPosition); // click to select
    await click(target, labelPosition); // click to edit
    const editLabelTextBox = canvas.getByPlaceholderText("Enter some text");
    void fireEvent.input(editLabelTextBox, { target: { value: "Edited my page label" } });
    await click(target, { clientX: 800, clientY: 500 }); // to save changes
    await sleep(500); // wait for update to complete
    await checkCytoElementProperties(
      '[label = "Edited my page label"]' /* page label */,
      {
        position: { x: 916, y: 164 }, // Label pushed back from the boundary
      },
      "truncated",
    );
  },
};

export const ShowEditLabel: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);

    const pageLabelPosition = { clientX: 873, clientY: 161 }; // Rotated user added text
    const obsBearingLabelPosition = { clientX: 426, clientY: 293 }; // Label 13
    const parcelAppellationLabelPosition = { clientX: 494, clientY: 265 }; // Label 14

    // click on a page label does show the input
    await cytoClick(canvasElement, pageLabelPosition); // click to select
    await cytoClick(canvasElement, pageLabelPosition); // click to edit
    await expect(await canvas.findByTestId("LabelTextInput-textarea")).toBeInTheDocument();
    // press Escape to cancel the edit label (does not change the mode)
    await userEvent.keyboard("{escape}");
    await waitFor(() => expect(canvas.queryByTestId("LabelTextInput-textarea")).toBeNull());

    // click on a diagram label does not show the input
    await cytoClick(canvasElement, obsBearingLabelPosition); // click to select
    await cytoClick(canvasElement, obsBearingLabelPosition); // click to edit
    await expect(canvas.queryByTestId("LabelTextInput-textarea")).toBeNull();

    // click on a parcel appellation label does show the input
    await cytoClick(canvasElement, parcelAppellationLabelPosition); // click to select
    await cytoClick(canvasElement, parcelAppellationLabelPosition); // click to edit
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
    await userEvent.keyboard("{delete}"); // press delete
    await checkCytoElementProperties("#LAB_23", { displayState: "display" }); // verify the label is not deleted
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
    // Select label mode keeps selected after editing a label
    // eslint-disable-next-line testing-library/no-node-access
    const cursorButton = (await within(canvasElement).findByTitle("Select Labels")).parentElement;
    await expect(cursorButton).toHaveClass("selected");
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
