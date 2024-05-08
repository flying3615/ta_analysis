import { Meta, StoryFn, StoryObj } from "@storybook/react";
import PlanSheets from "../PlanSheets";
import { MemoryRouter } from "react-router-dom";
import { userEvent, within } from "@storybook/testing-library";
import { sleep } from "@/test-utils/storybook-utils";

// react-menu styles
import "@szhsin/react-menu/dist/index.css";

export default {
  title: "PlanSheets",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

const PlanSheetsTemplate = () => {
  return (
    <MemoryRouter initialEntries={["/plan-generation/layout-plan-sheets/12345"]}>
      <PlanSheets />
    </MemoryRouter>
  );
};

export const Default: StoryFn<typeof PlanSheets> = () => {
  return <PlanSheetsTemplate />;
};

export const SmallViewport: StoryObj<typeof PlanSheets> = {
  render: () => <PlanSheetsTemplate />,
  parameters: {
    viewport: {
      defaultViewport: "tablet",
      defaultOrientation: "landscape",
    },
  },
};

export const DiagramsPanelClosed: StoryObj<typeof PlanSheets> = {
  render: () => <PlanSheetsTemplate />,
  parameters: {
    viewport: {
      defaultViewport: "tablet",
      defaultOrientation: "landscape",
    },
  },
};
DiagramsPanelClosed.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(await canvas.findByTitle("Toggle diagrams panel"));
  await sleep(2000);
};
