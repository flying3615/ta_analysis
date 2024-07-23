import { PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { Meta, StoryObj } from "@storybook/react";

import { diagrams, lineEdges, markNodes } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder.ts";
import { extractEdges, extractNodes } from "@/modules/plan/extractGraphData.ts";

import CytoscapeCanvas, { IInitZoom } from "../CytoscapeCanvas";

export default {
  title: "CytoscapeCanvas",
  component: CytoscapeCanvas,
} as Meta<typeof CytoscapeCanvas>;

type Story = StoryObj<typeof CytoscapeCanvas>;

export const Default: Story = {
  render: () => (
    <div style={{ height: "100vh" }}>
      <CytoscapeCanvas
        nodeData={markNodes}
        edgeData={lineEdges}
        diagrams={diagrams}
        onChange={(data) => {
          console.info("Cytoscape canvas changed", data);
        }}
      />
    </div>
  ),
};

const fromBuilder = () =>
  new PlanDataBuilder().addDiagram({
    x: 80,
    y: -90,
  });

const allSymbolCodes = [63, 117, 96, 97, 111, 112, 179, 181, 182];

const CanvasFromMockData = (props: { data: PlanResponseDTO; initZoom?: IInitZoom }) => {
  const nodeData = extractNodes(props.data.diagrams);
  const edgeData = extractEdges(props.data.diagrams);

  return (
    <div style={{ height: "100vh" }}>
      <CytoscapeCanvas
        nodeData={nodeData}
        edgeData={edgeData}
        diagrams={props.data.diagrams}
        initZoom={props.initZoom}
        onChange={(data) => {
          console.info("Cytoscape canvas changed", data);
        }}
      />
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

export const SymbolNodesWithLabels: StoryObj<typeof CytoscapeCanvas> = {
  render: () => {
    const builder = fromBuilder();

    allSymbolCodes.forEach((code, idx) => {
      const ypos = -10 - 4 * idx;

      builder.addSymbolLabel(idx * 10, code.toString(), {
        x: 20,
        y: ypos,
      });
      builder.addLabel(
        "coordinateLabels",
        idx * 10 + 1,
        code.toString(),
        {
          x: 24,
          y: ypos - 1,
        },
        undefined,
        undefined,
        "display",
        "Tahoma",
        8,
      );
    });
    return <CanvasFromMockData data={builder.build()} initZoom={{ zoom: 1.5, pan: { x: 0, y: 0 } }} />;
  },
  parameters: {
    viewport: {
      defaultViewport: "tablet",
      defaultOrientation: "landscape",
    },
  },
};

export const SymbolNodesLocationAndSize: StoryObj<typeof CytoscapeCanvas> = {
  render: () => {
    const builder = fromBuilder();
    // Calculated as 1 plan pixels => 0.1079 meters @3.64 ground metres per cm
    const spacingPixels = 0.1079;

    allSymbolCodes.forEach((code, idx) => {
      // Codes can be ascii codes or characters
      builder.addSymbolLabel(idx * 10, String.fromCharCode(code), {
        x: 60 + idx * 20 * spacingPixels,
        y: -50,
      });
      builder.addSymbolLabel(idx * 10 + 1, code.toString(), {
        x: 60 + idx * 20 * spacingPixels,
        y: -50 - 20 * spacingPixels,
      });
    });

    return <CanvasFromMockData data={builder.build()} initZoom={{ zoom: 4.0, pan: { x: -800, y: -550 } }} />;
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      defaultOrientation: "landscape",
    },
  },
};
