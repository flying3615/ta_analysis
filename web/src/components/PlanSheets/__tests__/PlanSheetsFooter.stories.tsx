import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { queryClient } from "@/queries";
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
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <MemoryRouter initialEntries={["/plan-generation/layout-plan-sheets/123"]}>
          <Routes>
            <Route
              path="/plan-generation/layout-plan-sheets/:transactionId"
              element={
                <PlanSheetsFooter diagramsPanelOpen={diagramsPanelOpen} setDiagramsPanelOpen={setDiagramsPanelOpen} />
              }
            />
          </Routes>
        </MemoryRouter>
      </Provider>
    </QueryClientProvider>
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
