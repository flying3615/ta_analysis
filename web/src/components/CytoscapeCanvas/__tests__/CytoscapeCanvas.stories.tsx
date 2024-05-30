import { Meta, StoryObj } from "@storybook/react";
import CytoscapeCanvas from "../CytoscapeCanvas";
import { diagrams, lineEdges, markNodes } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import { buildMockLineTypes } from "@/mocks/data/mockLineTypes.ts";
import { extractEdges, extractNodes } from "@/modules/plan/extractGraphData.ts";
import { PlanResponseDTO } from "@linz/survey-plan-generation-api-client";

export default {
  title: "CytoscapeCanvas",
  component: CytoscapeCanvas,
} as Meta<typeof CytoscapeCanvas>;

type Story = StoryObj<typeof CytoscapeCanvas>;

export const Default: Story = {
  render: () => (
    <div style={{ height: "100vh" }}>
      <CytoscapeCanvas nodeData={markNodes} edgeData={lineEdges} diagrams={diagrams} />
    </div>
  ),
};

const CanvasFromMockData = (props: { data: PlanResponseDTO }) => {
  console.log(JSON.stringify(props.data));

  const nodeData = extractNodes(props.data.diagrams);
  console.log(JSON.stringify(nodeData));
  const edgeData = extractEdges(props.data.diagrams);
  console.log(JSON.stringify(edgeData));

  return (
    <div style={{ height: "100vh" }}>
      <CytoscapeCanvas nodeData={nodeData} edgeData={edgeData} diagrams={props.data.diagrams} />
    </div>
  );
};

export const RendersSpecifiedLineTypes: StoryObj<typeof CytoscapeCanvas> = {
  render: () => <CanvasFromMockData data={buildMockLineTypes()} />,
  parameters: {
    viewport: {
      defaultViewport: "tablet",
      defaultOrientation: "landscape",
    },
  },
};
