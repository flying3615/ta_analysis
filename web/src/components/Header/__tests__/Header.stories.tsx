// react-menu styles
import "@szhsin/react-menu/dist/index.css";

import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import { StorybookRouter } from "@/test-utils/storybook-utils";

import Header from "../Header";

export default {
  title: "Header",
  component: Header,
} as Meta<typeof Header>;

type Story = StoryObj<typeof Header>;

const queryClient = new QueryClient();

export const Default: Story = {
  render: () => (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <StorybookRouter url={generatePath(Paths.defineDiagrams, { transactionId: "12345" })}>
          <Route path={Paths.defineDiagrams} element={<Header view="Diagrams" />} />
          <Route path={Paths.layoutPlanSheets} element={<Header view="Sheets" />} />
        </StorybookRouter>
      </Provider>
    </QueryClientProvider>
  ),
  parameters: {
    chromatic: { diffThreshold: 0.8 },
  },
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
