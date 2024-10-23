import { DiagramDTO } from "@linz/survey-plan-generation-api-client";
import { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import { CytoscapeContextProvider } from "@/components/CytoscapeCanvas/CytoscapeContextProvider";
import {
  nestedMiniTitlePlan,
  nestedSurveyPlan,
  nestedTitlePlan,
} from "@/components/PlanSheets/__tests__/data/plansheetDiagramData";
import { Default } from "@/components/PlanSheets/__tests__/PlanSheets.stories";
import { DiagramList } from "@/components/PlanSheets/DiagramList";
import SidePanel from "@/components/SidePanel/SidePanel";
import { mockSurveyInfo } from "@/mocks/data/mockSurveyInfo";
import { Paths } from "@/Paths";
import { store } from "@/redux/store";
import { ModalStoryWrapper, sleep, StorybookRouter } from "@/test-utils/storybook-utils";

export default {
  title: "PlanSheets/DiagramList",
  component: DiagramList,
} as Meta<typeof DiagramList>;

interface IDiagramListProps {
  diagrams: DiagramDTO[];
}

type Story = StoryObj<typeof DiagramList>;

const queryClient = new QueryClient();

const TemplateDiagramList = ({ diagrams }: IDiagramListProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <CytoscapeContextProvider>
          <ModalStoryWrapper>
            <StorybookRouter url={generatePath(Paths.layoutPlanSheets, { transactionId: "123" })}>
              <Route path={Paths.layoutPlanSheets} element={<DiagramList diagrams={diagrams} />} />
            </StorybookRouter>
          </ModalStoryWrapper>
        </CytoscapeContextProvider>
      </Provider>
    </QueryClientProvider>
  );
};

export const NestedDiagramTitleList: Story = {
  render: () => (
    <SidePanel align="left" isOpen={true}>
      <div style={{ height: "100vh" }}>
        <TemplateDiagramList diagrams={nestedTitlePlan.diagrams} />
      </div>
    </SidePanel>
  ),
};

export const NestedDiagramSurveyList: Story = {
  render: () => (
    <SidePanel align="left" isOpen={true}>
      <div style={{ height: "100vh" }}>
        <TemplateDiagramList diagrams={nestedSurveyPlan.diagrams} />
      </div>
    </SidePanel>
  ),
};

export const DiagramListIsSortedBasedOnListOrder: Story = {
  render: () => (
    <SidePanel align="left" isOpen={true}>
      <div style={{ height: "100vh" }}>
        <TemplateDiagramList diagrams={nestedTitlePlan.diagrams.reverse()} />
      </div>
    </SidePanel>
  ),
};

export const DiagramListDisabledRemoveButtonEnabled: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.post(/\/123\/plan-regenerate$/, () => HttpResponse.json(undefined, { status: 200, statusText: "OK" })),
        http.get(/\/123\/plan$/, () => {
          return HttpResponse.json(nestedMiniTitlePlan, { status: 200, statusText: "OK" });
        }),
        http.get(/\/api\/survey\/123\/survey-info/, () => {
          return HttpResponse.json(mockSurveyInfo, { status: 200, statusText: "OK" });
        }),
      ],
    },
  },
};

export const RemoveDiagramFromSameAndDifferentPage: Story = {
  ...Default,
  parameters: {
    msw: {
      handlers: [
        http.post(/\/123\/plan-regenerate$/, () => HttpResponse.json(undefined, { status: 200, statusText: "OK" })),
        http.get(/\/123\/plan$/, () => {
          return HttpResponse.json(nestedMiniTitlePlan, { status: 200, statusText: "OK" });
        }),
        http.get(/\/api\/survey\/123\/survey-info/, () => {
          return HttpResponse.json(mockSurveyInfo, { status: 200, statusText: "OK" });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await sleep(500);
    const canvas = within(canvasElement);
    const nextButton = canvas.getByLabelText("Next");
    const prevButton = canvas.getByLabelText("Previous");

    // remove button should be there, and its parent will be disabled.
    await sleep(2000);
    await userEvent.click(nextButton);

    const removeButton = canvas.getByLabelText("Remove from sheet");
    await sleep(2000);
    await userEvent.click(removeButton);

    await sleep(2000);
    await userEvent.click(prevButton);
    await sleep(2000);
    await userEvent.click(removeButton);
  },
};
