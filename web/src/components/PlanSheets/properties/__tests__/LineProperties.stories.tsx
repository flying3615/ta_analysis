import { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import {
  clickAtCoordinates,
  getCytoscapeNodeLayer,
  ModalStoryWrapper,
  RIGHT_MOUSE_BUTTON,
  sleep,
  StorybookRouter,
  tabletLandscapeParameters,
} from "@/test-utils/storybook-utils";

export default {
  title: "PlanSheets/Properties/LinePropertiesPanel",
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
export const ShowLineMenu: Story = {
  ...Default,
  ...tabletLandscapeParameters,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    clickAtCoordinates(cytoscapeNodeLayer, 520, 135, RIGHT_MOUSE_BUTTON);
    await sleep(500);
  },
};
export const ShowLineMenuProperties: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle("Select Lines"));
    await sleep(500);

    const cytoscapeElement = await within(canvasElement).findByTestId("MainCytoscapeCanvas");
    const cytoscapeNodeLayer = getCytoscapeNodeLayer(cytoscapeElement);
    clickAtCoordinates(cytoscapeNodeLayer, 520, 135, RIGHT_MOUSE_BUTTON);
    await sleep(500);
    const ctxMenuElement = await within(canvasElement).findByTestId("cytoscapeContextMenu");
    const propertiesMenuItem = within(ctxMenuElement).getByText("Properties");
    await userEvent.click(propertiesMenuItem);
  },
};
