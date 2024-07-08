import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import { useState } from "react";
import { Provider } from "react-redux";

import { store } from "@/redux/store.ts";

import PlanSheetsFooter from "../PlanSheetsFooter.tsx";

export default {
  title: "PlanSheetsFooter",
  component: PlanSheetsFooter,
  argTypes: {
    content: {
      control: "text",
    },
  },
} as Meta<typeof PlanSheetsFooter>;

type Story = StoryObj<typeof PlanSheetsFooter>;

const TemplatePlanSheetsFooter = () => {
  const [diagramsPanelOpen, setDiagramsPanelOpen] = useState<boolean>(true);

  return (
    <Provider store={store}>
      <PlanSheetsFooter diagramsPanelOpen={diagramsPanelOpen} setDiagramsPanelOpen={setDiagramsPanelOpen} />
    </Provider>
  );
};

export const Default: Story = {
  render: () => (
    <div style={{ height: "100vh" }}>
      <TemplatePlanSheetsFooter />
    </div>
  ),
};

export const SelectTitleSheetView: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByTitle("Change sheet view"));
    await expect(await canvas.findByText("Title sheet")).toHaveAttribute("aria-disabled", "true");
    await expect(await canvas.findByText("Survey sheet")).not.toHaveAttribute("aria-disabled");
  },
};

export const SelectSurveySheetView: Story = {
  ...Default,
  render: () => (
    <div style={{ height: "100vh" }}>
      <TemplatePlanSheetsFooter />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByTitle("Change sheet view"));
    await userEvent.click(await canvas.findByText("Survey sheet"));
    await userEvent.click(await canvas.findByTitle("Change sheet view"));

    await expect(await canvas.findByText("Title sheet")).not.toHaveAttribute("aria-disabled");
    await expect(await canvas.findByText("Survey sheet")).toHaveAttribute("aria-disabled", "true");
  },
};
