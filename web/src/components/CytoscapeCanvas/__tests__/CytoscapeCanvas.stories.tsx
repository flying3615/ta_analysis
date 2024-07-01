import { Meta, StoryObj } from "@storybook/react";
import CytoscapeCanvas from "../CytoscapeCanvas";
import { diagrams, lineEdges, markNodes } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import { extractEdges, extractNodes } from "@/modules/plan/extractGraphData.ts";
import { PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder.ts";

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

const fromBuilder = () =>
  new PlanDataBuilder().addDiagram({
    x: 80,
    y: -90,
  });

const CanvasFromMockData = (props: { data: PlanResponseDTO }) => {
  const nodeData = extractNodes(props.data.diagrams);
  const edgeData = extractEdges(props.data.diagrams);

  return (
    <div style={{ height: "100vh" }}>
      <CytoscapeCanvas nodeData={nodeData} edgeData={edgeData} diagrams={props.data.diagrams} />
    </div>
  );
};

export const RendersSpecifiedLineTypes: StoryObj<typeof CytoscapeCanvas> = {
  render: () => {
    const lineStyles = [
      "solid",
      "peck1",
      "dot1",
      "dot2",
      "brokenSolid1", // Will render as solid
      "arrow1",
      "doubleArrow1",
    ];

    const gap = 5;
    const xStart = 20;
    const yStart = 20;
    const xEnd = 120;

    const builder = fromBuilder();
    lineStyles.forEach((lineStyle, index) => {
      const idFrom = (index + 1) * 10;
      const idTo = (index + 1) * 10 + 1;
      const yPos = -(index * gap + yStart);

      builder.addCooordinate(idFrom, { x: xStart, y: yPos });
      builder.addCooordinate(idTo, { x: xEnd, y: yPos });

      builder.addLine((index + 1) * 1000, [idFrom, idTo], 1, "observation", lineStyle);
    });
    const mockLineTypes = builder.build();
    return <CanvasFromMockData data={mockLineTypes} />;
  },
  parameters: {
    viewport: {
      defaultViewport: "tablet",
      defaultOrientation: "landscape",
    },
  },
};

export const RendersLabelsWithSizeAndFont: StoryObj<typeof CytoscapeCanvas> = {
  render: () => {
    const fonts = ["Tahoma", "Arial", "Times New Roman"];

    const gap = 10;
    const xStart = 10;
    const yStart = 10;
    const columnWidth = 120 / fonts.length;

    const smallestFontSize = 8;
    const largestFontSize = 16;

    const builder = fromBuilder();
    for (let fontSize = smallestFontSize; fontSize <= largestFontSize; fontSize++) {
      fonts.forEach((font, index) => {
        builder.addLabel(
          "labels",
          index * 100 + fontSize,
          `${font} ${fontSize}px`,
          {
            x: xStart + index * columnWidth,
            y: -(yStart + (fontSize - smallestFontSize) * gap),
          },
          undefined,
          undefined,
          "display",
          font,
          fontSize,
        );
      });
    }

    return <CanvasFromMockData data={builder.build()} />;
  },
  parameters: {
    viewport: {
      defaultViewport: "tablet",
      defaultOrientation: "landscape",
    },
  },
};
