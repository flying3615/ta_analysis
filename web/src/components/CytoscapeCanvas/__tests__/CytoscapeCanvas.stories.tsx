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

export const RendersLabelsWithBorder: StoryObj<typeof CytoscapeCanvas> = {
  render: () => {
    const borderWidths = [undefined, 0.7, 1.0, 2.0];

    const gap = 10;

    const builder = fromBuilder();
    borderWidths.forEach((borderWidth, index) => {
      builder.addLabel(
        "labels",
        index * 100,
        `borderWidth: ${borderWidth}`,
        {
          x: 20,
          y: -(20 + index * gap),
        },
        undefined,
        undefined,
        "display",
        "Tahoma",
        14,
        undefined,
        undefined,
        undefined,
        undefined,
        borderWidth,
      );
      builder.addLabel(
        "labels",
        index * 100 + 1,
        `borderWidth: ${borderWidth} halo`,
        {
          x: 80,
          y: -(20 + index * gap),
        },
        undefined,
        undefined,
        "display",
        "Tahoma",
        14,
        "halo",
        undefined,
        undefined,
        undefined,
        borderWidth,
      );
    });

    return <CanvasFromMockData data={builder.build()} />;
  },
  parameters: {
    viewport: {
      defaultViewport: "tablet",
      defaultOrientation: "landscape",
    },
  },
};

export const RendersLabelsWithEffectStateAndSymbolType: StoryObj<typeof CytoscapeCanvas> = {
  render: () => {
    const effects = ["none", "halo"];
    const displayStates = ["display", "hide", "systemDisplay", "systemHide"];

    const gap = 10;
    const xStart = 10;
    const yStart = 10;
    const columnWidth = 120 / (effects.length * displayStates.length);

    const builder = fromBuilder();
    effects.forEach((effect, effectIdx) => {
      displayStates.forEach((displayState, displayStateIdx) => {
        const id = 100000 * (effectIdx * 100 + displayStateIdx * 10);
        const xOffset = columnWidth * (effects.length * displayStateIdx);
        const x = xStart + xOffset;
        builder.addLabel(
          "labels",
          id,
          `${effect}\n${displayState}`,
          {
            x: x,
            y: -(yStart + effectIdx * gap),
          },
          undefined,
          undefined,
          "display",
          "Tahoma",
          14,
          effect,
          displayState,
          undefined,
          "bottomCenter,textCenter",
        );
        builder.addCooordinate(id + 1, { x: x, y: 6 - (yStart + effectIdx * gap) });
        builder.addCooordinate(id + 2, {
          x: x,
          y: -(2 + yStart + effectIdx * gap),
        });
        builder.addLine(id + 3, [id + 1, id + 2], 5, "observation", "solid");
      });
    });

    builder.addLabel(
      "labels",
      9000001,
      "A",
      {
        x: 30,
        y: -50,
      },
      undefined,
      undefined,
      "display",
      "Tahoma",
      14,
      "none",
      "display",
      "circle",
      "bottomCenter,textCenter",
    );
    builder.addLabel(
      "labels",
      9000002,
      "ZZ",
      {
        x: 50,
        y: -50,
      },
      undefined,
      undefined,
      "display",
      "Tahoma",
      14,
      "none",
      "display",
      "circle",
      "bottomCenter,textCenter",
    );
    builder.addLabel(
      "labels",
      9000003,
      "QQ",
      {
        x: 70,
        y: -50,
      },
      undefined,
      undefined,
      "display",
      "Tahoma",
      14,
      "none",
      "display",
      "circle",
      "bottomCenter,textCenter",
    );

    return <CanvasFromMockData data={builder.build()} />;
  },
  parameters: {
    viewport: {
      defaultViewport: "tablet",
      defaultOrientation: "landscape",
    },
  },
};

export const RendersLabelsWithOffsetAndRotation: StoryObj<typeof CytoscapeCanvas> = {
  render: () => {
    const centreX = 30;
    const centreY = -50;

    const builder = fromBuilder();
    for (let angle = 0; angle < 360; angle += 60) {
      builder.addRotatedLabel(
        "labels",
        angle * 100,
        `rotate=${angle}`,
        {
          x: centreX,
          y: centreY,
        },
        "Arial",
        20,
        angle,
        0,
        0,
      );
      builder.addRotatedLabel(
        "labels",
        angle * 100 + 1,
        `anchor=${angle}`,
        {
          x: centreX + 30,
          y: centreY,
        },
        "Arial",
        14,
        0,
        angle,
        50,
      );
      builder.addRotatedLabel(
        "labels",
        angle * 100 + 2,
        `anchor&rotate=${angle}`,
        {
          x: centreX + 70,
          y: centreY,
        },
        "Arial",
        14,
        angle,
        angle,
        100,
      );
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

export const RendersLabelsWithTextAlignment: StoryObj<typeof CytoscapeCanvas> = {
  render: () => {
    const startX = 20;
    const startY = 0;
    const xStep = 30;
    const yStep = 10;
    const numColumns = 3;

    const textAlignments = [
      "bottomCenter,textCenter",
      "bottomCenter,textRight",
      "bottomCenter",
      "bottomLeft,textCenter",
      "bottomLeft,textRight",
      "bottomLeft",
      "bottomRight,textCenter",
      "bottomRight,textRight",
      "bottomRight",
      "centerCenter,textCenter",
      "centerCenter,textRight",
      "centerCenter",
      "centerLeft,textCenter",
      "centerLeft,textRight",
      "centerLeft",
      "centerRight,textCenter",
      "centerRight,textRight",
      "centerRight",
      "topCenter,textCenter",
      "topCenter,textRight",
      "topCenter",
      "topLeft,textCenter",
      "topLeft,textRight",
      "topLeft",
      "topRight,textCenter",
      "topRight,textRight",
      "topRight",
    ];

    const builder = fromBuilder();

    textAlignments.forEach((textAlignment, idx) => {
      const x = startX + (idx % numColumns) * xStep;
      const y = startY - Math.trunc(idx / numColumns) * yStep;

      builder.addLabel(
        "labels",
        idx,
        textAlignment.replace(",", "\n"),
        { x, y },
        undefined,
        undefined,
        undefined,
        "Arial",
        14,
        "none",
        "display",
        undefined,
        textAlignment,
        0.7,
      );
      builder.addSymbolLabel(10000 + idx, "63", {
        x,
        y,
      });
    });

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
          y: ypos,
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
      builder.addSymbolLabel((idx + 1) * 10, String.fromCharCode(code), {
        x: 60 + idx * 20 * spacingPixels,
        y: -50,
      });
      builder.addSymbolLabel((idx + 1) * 10 + 1, code.toString(), {
        x: 60 + idx * 20 * spacingPixels,
        y: -50 - 20 * spacingPixels,
      });
      builder.addLine((idx + 1) * 10 + 2, [(idx + 1) * 10, (idx + 1) * 10 + 1], 0.7);
      if (idx > 0) {
        builder.addLine((idx + 1) * 10 + 3, [idx * 10, (idx + 1) * 10], 0.7);
      }
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
