import { Meta, StoryObj } from "@storybook/react";
import Header from "../Header";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { within, userEvent } from "@storybook/testing-library";
import { expect } from "@storybook/jest";
import { Paths } from "@/Paths";
// react-menu styles
import "@szhsin/react-menu/dist/index.css";
import { queryClient } from "@/queries";
import { store } from "@/redux/store.ts";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";

export default {
  title: "Header",
  component: Header,
} as Meta<typeof Header>;

type Story = StoryObj<typeof Header>;

export const Default: Story = {
  render: () => (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <MemoryRouter initialEntries={["/plan-generation/define-diagrams/12345"]}>
          <Routes>
            <Route path={Paths.defineDiagrams} element={<Header view="Diagrams" />} />
            <Route path={Paths.layoutPlanSheets} element={<Header view="Sheets" />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    </QueryClientProvider>
  ),
};

export const OpenHeaderToggle: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByText("Diagrams"));
    await expect(await canvas.findByText("Define Diagrams")).toHaveAttribute("aria-disabled", "true");
    await expect(await canvas.findByText("Layout Plan Sheets")).not.toHaveAttribute("aria-disabled");

    await userEvent.click(await canvas.findByText("Layout Plan Sheets"));
    await userEvent.click(await canvas.findByText("Sheets"));
    await expect(await canvas.findByText("Define Diagrams")).not.toHaveAttribute("aria-disabled");
    await expect(await canvas.findByText("Layout Plan Sheets")).toHaveAttribute("aria-disabled", "true");
  },
};
