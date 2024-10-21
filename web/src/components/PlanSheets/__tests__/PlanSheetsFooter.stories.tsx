import { LuiModalAsyncContextProvider } from "@linzjs/windows";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { useState } from "react";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import { CytoscapeContextProvider } from "@/components/CytoscapeCanvas/CytoscapeContextProvider";
import PlanSheetsFooter from "@/components/PlanSheets/PlanSheetsFooter";
import { AsyncTaskBuilder } from "@/mocks/builders/AsyncTaskBuilder";
import { mockSurveyInfo } from "@/mocks/data/mockSurveyInfo";
import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext";
import { sleep, StorybookRouter } from "@/test-utils/storybook-utils";

export default {
  title: "PlanSheets/PlanSheetsFooter",
  component: PlanSheetsFooter,
  argTypes: {
    content: {
      control: "text",
    },
  },
} as Meta<typeof PlanSheetsFooter>;

type Story = StoryObj<typeof PlanSheetsFooter>;

const queryClient = new QueryClient();

const TemplatePlanSheetsFooter = () => {
  const [diagramsPanelOpen, setDiagramsPanelOpen] = useState<boolean>(true);

  return (
    <QueryClientProvider client={queryClient}>
      <FeatureFlagProvider>
        <Provider store={store}>
          <LuiModalAsyncContextProvider>
            <CytoscapeContextProvider>
              <StorybookRouter url={generatePath(Paths.layoutPlanSheets, { transactionId: "123" })}>
                <Route
                  path={Paths.layoutPlanSheets}
                  element={
                    <PlanSheetsFooter
                      diagramsPanelOpen={diagramsPanelOpen}
                      setDiagramsPanelOpen={setDiagramsPanelOpen}
                      surveyInfo={mockSurveyInfo}
                    />
                  }
                />
              </StorybookRouter>
            </CytoscapeContextProvider>
          </LuiModalAsyncContextProvider>
        </Provider>
      </FeatureFlagProvider>
    </QueryClientProvider>
  );
};

export const Default: Story = {
  render: () => (
    <div style={{ height: "100vh" }}>
      <TemplatePlanSheetsFooter />
    </div>
  ),
};

export const SelectTitleSheetView: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByTitle("Change sheet view"));
    await expect(await canvas.findByText("Title sheet")).toHaveAttribute("aria-disabled", "true");
    await expect(await canvas.findByText("Survey sheet")).not.toHaveAttribute("aria-disabled");
  },
};

export const SelectSurveySheetView: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByTitle("Change sheet view"));
    await userEvent.click(await canvas.findByText("Survey sheet"));
    await userEvent.click(await canvas.findByTitle("Change sheet view"));

    await expect(await canvas.findByText("Title sheet")).not.toHaveAttribute("aria-disabled");
    await expect(await canvas.findByText("Survey sheet")).toHaveAttribute("aria-disabled", "true");
  },
};

export const PlanSaveInProgressModal: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.post(/\/123\/plan-regenerate$/, () => HttpResponse.json(undefined, { status: 200, statusText: "OK" })),
        http.put(/\/123\/plan$/, () =>
          HttpResponse.json(new AsyncTaskBuilder().build(), {
            status: 202,
            statusText: "ACCEPTED",
          }),
        ),
        http.get(/\/123\/async-task/, () =>
          HttpResponse.json(new AsyncTaskBuilder().withInProgressStatus().build(), {
            status: 200,
            statusText: "OK",
          }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText("Save layout"));
    await sleep(1000);
  },
};

export const PlanSaveFailedModal: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.post(/\/123\/plan-regenerate$/, () => HttpResponse.json(undefined, { status: 200, statusText: "OK" })),
        http.put(/\/123\/plan$/, () =>
          HttpResponse.json(new AsyncTaskBuilder().build(), { status: 202, statusText: "ACCEPTED" }),
        ),
        http.get(/\/123\/async-task/, () =>
          HttpResponse.json(new AsyncTaskBuilder().withFailedStatus().build(), {
            status: 200,
            statusText: "OK",
          }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText("Save layout"));
    await sleep(1000);
  },
};
