import { Meta, StoryObj } from "@storybook/react";

import { nestedSurveyPlan, nestedTitlePlan } from "@/components/PlanSheets/__tests__/data/plansheetDiagramData.ts";
import { DiagramList } from "@/components/PlanSheets/DiagramList.tsx";

export default {
  title: "PlanSheets/DiagramList",
  component: DiagramList,
} as Meta<typeof DiagramList>;

type Story = StoryObj<typeof DiagramList>;

export const NestedDiagramTitleList: Story = {
  render: () => (
    <div style={{ height: "100vh" }}>
      <DiagramList diagrams={nestedTitlePlan.diagrams} />
    </div>
  ),
};

export const NestedDiagramSurveyList: Story = {
  render: () => (
    <div style={{ height: "100vh" }}>
      <DiagramList diagrams={nestedSurveyPlan.diagrams} />
    </div>
  ),
};

export const DiagramListIsSortedBasedOnListOrder: Story = {
  render: () => (
    <div style={{ height: "100vh" }}>
      <DiagramList diagrams={nestedTitlePlan.diagrams.reverse()} />
    </div>
  ),
};
