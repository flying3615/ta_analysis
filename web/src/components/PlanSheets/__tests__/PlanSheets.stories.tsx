import { Meta, StoryObj } from "@storybook/react";
import PlanSheets from "../PlanSheets";
import { MemoryRouter } from "react-router-dom";
import { userEvent, within } from "@storybook/testing-library";
import { sleep } from "@/test-utils/storybook-utils";

// react-menu styles
import "@szhsin/react-menu/dist/index.css";
import { Provider } from "react-redux";
import { store } from "@/redux/store.ts";
import { Route, Routes } from "react-router";

export default {
  title: "PlanSheets",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

type Story = StoryObj<typeof PlanSheets>;

const PlanSheetsTemplate = () => {
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={["/plan-generation/layout-plan-sheets/123"]}>
        <Routes>
          <Route path="/plan-generation/layout-plan-sheets/:transactionId" element={<PlanSheets />}></Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

export const Default: Story = {
  render: () => <PlanSheetsTemplate />,
};

export const SmallViewport: Story = {
  ...Default,
  parameters: {
    viewport: {
      defaultViewport: "tablet",
      defaultOrientation: "landscape",
    },
  },
};

export const DiagramsPanelClosed: Story = {
  ...SmallViewport,
};
DiagramsPanelClosed.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(await canvas.findByTitle("Toggle diagrams panel"));
  await sleep(2000);
};
