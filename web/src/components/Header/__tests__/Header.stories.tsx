import { Meta, StoryObj } from "@storybook/react";
import Header from "../Header";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { within, userEvent } from "@storybook/testing-library";
import { expect } from "@storybook/jest";
import { Paths } from "@/Paths";
// react-menu styles
import "@szhsin/react-menu/dist/index.css";

export default {
  title: "Header",
  component: Header,
} as Meta<typeof Header>;

type Story = StoryObj<typeof Header>;
const Template = () => {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route
        path={Paths.defineDiagrams}
        element={<Header onNavigate={navigate} transactionId="12345" view="Diagrams" />}
      />
      <Route
        path={Paths.layoutPlanSheets}
        element={<Header onNavigate={navigate} transactionId="12345" view="Sheets" />}
      />
    </Routes>
  );
};

export const Default: Story = {
  render: () => (
    <MemoryRouter initialEntries={["/plan-generation/define-diagrams/12345"]}>
      <Template />
    </MemoryRouter>
  ),
};

export const OpenHeaderToggle: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByText("Diagrams"));
    await expect(await canvas.findByText("Define diagrams")).toHaveAttribute("aria-disabled", "true");
    await expect(await canvas.findByText("Layout Plan Sheets")).not.toHaveAttribute("aria-disabled");

    await userEvent.click(await canvas.findByText("Layout Plan Sheets"));
    await userEvent.click(await canvas.findByText("Sheets"));
    await expect(await canvas.findByText("Define diagrams")).not.toHaveAttribute("aria-disabled");
    await expect(await canvas.findByText("Layout Plan Sheets")).toHaveAttribute("aria-disabled", "true");
  },
};
