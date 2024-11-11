import { PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react/*";
import { userEvent } from "@storybook/test";
import { within } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import { mockPlanData } from "@/mocks/data/mockPlanData";
import { handlers } from "@/mocks/mockHandlers";
import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import {
  clickAtPosition,
  getCytoCanvas,
  ModalStoryWrapper,
  RIGHT_MOUSE_BUTTON,
  sleep,
  StorybookRouter,
} from "@/test-utils/storybook-utils";

import PlanSheets from "../PlanSheets";
import { PlanMode } from "../PlanSheetType";
import { diagramLabelParcelAppellation, pageLabelWithLineBreak } from "./data/customLabels";

export default {
  title: "PlanSheets/StackedLabels",
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

const Default: Story = {
  render: () => <PlanSheetsTemplate />,
};

const customMockPlanData = JSON.parse(JSON.stringify(mockPlanData)) as PlanResponseDTO;
if (customMockPlanData.pages[0]) {
  customMockPlanData.pages[0].labels = [...(customMockPlanData.pages[0].labels ?? []), pageLabelWithLineBreak];
}
if (customMockPlanData.diagrams[0]?.lineLabels?.[0]) {
  customMockPlanData.diagrams[0].lineLabels = [
    ...customMockPlanData.diagrams[0].lineLabels,
    diagramLabelParcelAppellation,
  ];
}

const CustomLabels: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.get(/\/123\/plan$/, () =>
          HttpResponse.json(customMockPlanData, {
            status: 200,
            statusText: "OK",
          }),
        ),
        ...handlers,
      ],
    },
  },
};

export const ClickOnPositionWithStackedLabels: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickAtPosition(target, { clientX: 805, clientY: 470 }, RIGHT_MOUSE_BUTTON);
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    await expect(await within(contextMenu).findByText("Hide")).toBeInTheDocument();
    await expect(await within(contextMenu).findByText("Select")).toBeInTheDocument();
    const selectButton = within(contextMenu).getByText("Select");
    await userEvent.click(selectButton);
    await expect(await within(contextMenu).findByText("Lot 123 Section 1")).toBeInTheDocument();
    await expect(await within(contextMenu).findByText("My page label with a line break")).toBeInTheDocument();
  },
};

export const ClickOnPositionWithoutStackedLabels: Story = {
  ...CustomLabels,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTitle(PlanMode.SelectLabel));
    await sleep(500);
    const target = getCytoCanvas(await canvas.findByTestId("MainCytoscapeCanvas"));
    clickAtPosition(target, { clientX: 860, clientY: 470 }, RIGHT_MOUSE_BUTTON);
    const contextMenu = await canvas.findByTestId("cytoscapeContextMenu");
    await expect(await within(contextMenu).findByText("Show")).toBeInTheDocument();
    void expect(within(contextMenu).queryByText("Select")).not.toBeInTheDocument();
  },
};
