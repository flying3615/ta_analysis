import { PanelsContextProvider } from "@linzjs/windows";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react/*";
import { within } from "@storybook/test";
import { userEvent } from "@storybook/testing-library";
import { Provider } from "react-redux";

import { setupStore } from "@/redux/store";
import { getMockedStore, modifiedState } from "@/test-utils/store-mock";
import { PanelInstanceContextMock } from "@/test-utils/storybook-utils";

import { defaultOptionalVisibileLabelTypes } from "../properties/LabelPropertiesUtils";
import { ViewLabelTypes } from "../ViewLabelTypes";

export default {
  title: "PlanSheets/ViewLabelTypes",
  component: ViewLabelTypes,
} as Meta<typeof ViewLabelTypes>;

const PanelTemplate = ({ version = "V1" }: { version?: "V1" | "V2" }) => {
  return (
    <Provider
      store={setupStore({
        ...getMockedStore(version).preloadedState,
        planSheets: { ...modifiedState({ viewableLabelTypes: defaultOptionalVisibileLabelTypes }, version) },
      })}
    >
      <PanelsContextProvider>
        <PanelInstanceContextMock>
          <ViewLabelTypes />
        </PanelInstanceContextMock>
      </PanelsContextProvider>
    </Provider>
  );
};

type Story = StoryObj<typeof PanelTemplate>;

export const Default: Story = {
  render: PanelTemplate,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("View labels")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Cancel" })).toBeEnabled();
    await expect(canvas.getByRole("button", { name: "OK" })).toBeDisabled();
  },
};

export const DefaultSliceV2: Story = {
  ...Default,
  name: "Default SliceV2",
  args: { version: "V2" },
};

export const ViewLabelsAllCheckboxInteraction: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox", { name: "All Indeterminate Check" })).toBeChecked(); // All checkbox is partially checked

    // When “All” checkbox is indeterminate, then selecting it turns it off and toggles viewability of all label types to off.
    await userEvent.click(canvas.getByRole("checkbox", { name: "All Indeterminate Check" }));
    await expect(canvas.getByRole("checkbox", { name: "All Check" })).not.toBeChecked(); // All checkbox is not checked
    await expect(canvas.getByRole("checkbox", { name: /mark names/i })).not.toBeChecked(); // Mark names checkbox is not checked
    await expect(canvas.getByRole("checkbox", { name: /observation codes/i })).not.toBeChecked(); // Observation code checkbox is not checked

    // When “All” checkbox is off, then selecting it turns it on and toggles viewability of all label types to on.
    await userEvent.click(canvas.getByRole("checkbox", { name: "All Check" }));
    await expect(canvas.getByRole("checkbox", { name: "All Check" })).toBeChecked(); // All checkbox is checked
    await expect(canvas.getByRole("checkbox", { name: /mark names/i })).toBeChecked(); // Mark names checkbox is checked
    await expect(canvas.getByRole("checkbox", { name: /observation codes/i })).toBeChecked(); // Observation code checkbox is checked

    // When “All” checkbox is on, then selecting it turns it off and toggles viewability of all label types to off.
    await userEvent.click(canvas.getByRole("checkbox", { name: "All Check" })); // turn all labels off
    await expect(canvas.getByRole("checkbox", { name: "All Check" })).not.toBeChecked(); // All checkbox is not checked
    await expect(canvas.getByRole("checkbox", { name: /observation codes/i })).not.toBeChecked(); // Observation code checkbox is not checked
    await expect(canvas.getByRole("checkbox", { name: /mark names/i })).not.toBeChecked(); // Mark names checkbox is not checked

    // When an individual Label Type is toggled off or on, and if any other Label Type setting is different from it, then the “All” checkbox is set to indeterminate
    await userEvent.click(canvas.getByRole("checkbox", { name: /observation codes/i })); // turn observation codes on
    await expect(canvas.getByRole("checkbox", { name: "All Indeterminate Check" })).toBeChecked(); // All checkbox is partially checked

    // When an individual Label Type is toggled off and all other Label Types are off, then the “All” checkbox is set to off
    await userEvent.click(canvas.getByRole("checkbox", { name: /observation codes/i })); // turn observation codes off
    await expect(canvas.getByRole("checkbox", { name: "All Check" })).not.toBeChecked(); // All checkbox is not checked

    // When an individual Label Type is toggled on and all other Label Types are on, then the “All” checkbox is set to on
    await userEvent.click(canvas.getByRole("checkbox", { name: "All Check" })); // turn on all labels
    await userEvent.click(canvas.getByRole("checkbox", { name: /observation codes/i })); // turn observation codes off
    await expect(canvas.getByRole("checkbox", { name: "All Indeterminate Check" })).toBeChecked(); // All checkbox is partially checked
    await userEvent.click(canvas.getByRole("checkbox", { name: /observation codes/i })); // turn observation codes on
    await expect(canvas.getByRole("checkbox", { name: "All Check" })).toBeChecked(); // All checkbox is checked
  },
};

export const ViewLabelsAllCheckboxInteractionSliceV2: Story = {
  ...ViewLabelsAllCheckboxInteraction,
  name: "View Labels All Checkbox Interaction SliceV2",
  args: { version: "V2" },
};
