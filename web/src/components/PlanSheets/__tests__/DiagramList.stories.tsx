import { IDiagram } from "@linz/survey-plan-generation-api-client";
import { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { Provider } from "react-redux";
import { generatePath, Route } from "react-router-dom";

import {
  nestedMiniTitlePlan,
  nestedSurveyPlan,
  nestedTitlePlan,
} from "@/components/PlanSheets/__tests__/data/plansheetDiagramData.ts";
import { Default } from "@/components/PlanSheets/__tests__/PlanSheets.stories.tsx";
import { DiagramList } from "@/components/PlanSheets/DiagramList.tsx";
import SidePanel from "@/components/SidePanel/SidePanel.tsx";
import { Paths } from "@/Paths.ts";
import { store } from "@/redux/store.ts";
import { ModalStoryWrapper, StorybookRouter } from "@/test-utils/storybook-utils.tsx";

export default {
  title: "PlanSheets/DiagramList",
  component: DiagramList,
} as Meta<typeof DiagramList>;

interface IDiagramListProps {
  diagrams: IDiagram[];
}

type Story = StoryObj<typeof DiagramList>;

const queryClient = new QueryClient();

const TemplateDiagramList = ({ diagrams }: IDiagramListProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ModalStoryWrapper>
          <StorybookRouter url={generatePath(Paths.layoutPlanSheets, { transactionId: "123" })}>
            <Route path={Paths.layoutPlanSheets} element={<DiagramList diagrams={diagrams} />} />
          </StorybookRouter>
        </ModalStoryWrapper>
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
        http.get(/\/123\/plan-check$/, () =>
          HttpResponse.json({ refreshRequired: false }, { status: 200, statusText: "OK" }),
        ),
        http.get(/\/123\/plan$/, () => {
          return HttpResponse.json(nestedMiniTitlePlan, { status: 200, statusText: "OK" });
        }),
      ],
    },
  },
};
