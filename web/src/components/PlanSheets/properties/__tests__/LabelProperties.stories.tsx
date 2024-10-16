import { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import {
  clickAtCoordinates,
  getCytoCanvas,
  RIGHT_MOUSE_BUTTON,
  sleep,
  StorybookRouter,
} from "@/test-utils/storybook-utils";

export default {
  title: "LabelPropertiesPanel",
  component: PlanSheets,
} as Meta<typeof PlanSheets>;

type Story = StoryObj<typeof PlanSheets>;

const queryClient = new QueryClient();

const PlanSheetsTemplate = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <StorybookRouter url={generatePath(Paths.layoutPlanSheets, { transactionId: "123" })}>
          <Route path={Paths.layoutPlanSheets} element={<PlanSheets />} />
        </StorybookRouter>
      </Provider>
    </QueryClientProvider>
  );
};

export const Default: Story = {
  render: () => <PlanSheetsTemplate />,
};

export const ShowLabelPropertiesPanel: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));

    const labelPosition = { clientX: 484, clientY: 269 };
    clickAtCoordinates(target, labelPosition.clientX, labelPosition.clientY, RIGHT_MOUSE_BUTTON);
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    const propertiesButton = await within(contextMenu).findByText("Properties");
    await userEvent.click(propertiesButton);
    await sleep(500);
  },
};
