import { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import {
  ModalStoryWrapper,
  StorybookRouter,
  tabletLandscapeParameters,
  TestCanvas,
} from "@/test-utils/storybook-utils";

export default {
  title: "PlanSheets/PageLine",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

type Story = StoryObj<typeof PlanSheets>;

const queryClient = new QueryClient();

const PlanSheetsTemplate = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ModalStoryWrapper>
          <StorybookRouter url={generatePath(Paths.layoutPlanSheets, { transactionId: "123" })}>
            <Route path={Paths.layoutPlanSheets} element={<PlanSheets />} />
          </StorybookRouter>
        </ModalStoryWrapper>
      </Provider>
    </QueryClientProvider>
  );
};

export const Default: Story = {
  render: () => <PlanSheetsTemplate />,
};

export const AddLineEnter: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Add line");
    await test.leftClick([363, 220]);
    await test.leftClick([241, 289]);
    await test.leftClick([180, 182]);
    await test.enterAt([405, 280]);
    await test.mouseMove([354, 135]);
    // The following should be verified by chromatic:
    // The View button should be enabled, the Add line button disabled
    // There should be a line with 3 segments.
    // The last mouse move should not produce a new segment
  },
};

export const AddLineDoubleClick: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const test = await TestCanvas.Create(canvasElement, "Add line");
    await test.leftClick([363, 220]);
    await test.leftClick([241, 289]);
    await test.leftClick([1237, 277]); // Outside the sheet. Shouldn't do anything
    await test.leftClick([180, 182]);
    await test.doubleClick([405, 280]);
    await test.mouseMove([354, 135]);
    // The following should be verified by chromatic:
    // The View button should be enabled, the Add line button disabled
    // There should be a line with 3 segments.
    // The last mouse move should not produce a new segment
  },
};
