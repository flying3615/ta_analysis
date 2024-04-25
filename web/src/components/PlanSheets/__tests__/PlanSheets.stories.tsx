import { Meta, StoryFn } from "@storybook/react";
import PlanSheets from "../PlanSheets";
import { MemoryRouter } from "react-router-dom";

// react-menu styles
import "@szhsin/react-menu/dist/index.css";

export default {
  title: "PlanSheets",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

export const Default: StoryFn<typeof PlanSheets> = () => {
  return (
    <MemoryRouter initialEntries={["/plan-generation/layout-plan-sheets/12345"]}>
      <PlanSheets />
    </MemoryRouter>
  );
};
