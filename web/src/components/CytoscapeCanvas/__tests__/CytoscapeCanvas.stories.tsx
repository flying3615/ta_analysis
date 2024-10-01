import { DisplayStateEnum, LabelDTO, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { expect } from "@storybook/jest";
import { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { userEvent, within } from "@storybook/testing-library";
import { Core } from "cytoscape";
import { useContext, useEffect } from "react";

import {
  diagrams,
  lineEdges,
  markNodes,
  pageBorderEdges,
  pageBorderNodes,
} from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import { CytoscapeContextMenu } from "@/components/CytoscapeCanvas/CytoscapeContextMenu.tsx";
import { CytoscapeContext } from "@/components/CytoscapeCanvas/CytoscapeContextProvider.tsx";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { ContextMenuState } from "@/hooks/useCytoscapeContextMenu.ts";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder.ts";
import { extractDiagramEdges, extractDiagramNodes } from "@/modules/plan/extractGraphData.ts";
import { sleep, withProviderDecorator } from "@/test-utils/storybook-utils";
import { pointsPerCm } from "@/util/cytoscapeUtil.ts";

import CytoscapeCanvas, { IInitZoom } from "../CytoscapeCanvas";

const mockedState = {
  planSheets: {
    diagrams: [],
    pages: [{ id: 0, pageNumber: 1, pageType: PlanSheetType.TITLE }],
    activeSheet: PlanSheetType.TITLE,
    activePageNumbers: {
      [PlanSheetType.TITLE]: 0,
      [PlanSheetType.SURVEY]: 0,
    },
    hasChanges: false,
  },
};

export default {
  title: "CytoscapeCanvas",
  component: CytoscapeCanvas,
  decorators: [withProviderDecorator(mockedState)],
} as Meta<typeof CytoscapeCanvas>;

type Story = StoryObj<typeof CytoscapeCanvas>;

const CytoscapeTemplate = () => {
  return (
    <div style={{ height: "100vh" }}>
      <CytoscapeCanvas
        nodeData={markNodes}
        edgeData={lineEdges}
        diagrams={diagrams}
        onNodeChange={(data) => console.info("Cytoscape node data changed", data)}
        onEdgeChange={(data) => console.info("Cytoscape edge data changed", data)}
        getContextMenuItems={() => undefined}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <CytoscapeTemplate />,
};

const fromBuilder = () =>
  new PlanDataBuilder().addDiagram(
    {
      x: 39,
      y: -24,
    },
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    100, // So 39m on ground = 39cm = plan width
  );

const allSymbolCodes = [63, 117, 96, 97, 111, 112, 179, 181, 182];

const CanvasFromMockData = (props: { data: PlanResponseDTO; initZoom?: IInitZoom }) => {
  const nodeData = extractDiagramNodes(props.data.diagrams);
  const edgeData = extractDiagramEdges(props.data.diagrams);

  return (
    <div style={{ height: "100vh" }}>
      <CytoscapeCanvas
        nodeData={nodeData}
        edgeData={edgeData}
        diagrams={props.data.diagrams}
        initZoom={props.initZoom}
        onNodeChange={(data) => console.info("Cytoscape node data changed", data)}
        onEdgeChange={(data) => console.info("Cytoscape edge data changed", data)}
        getContextMenuItems={() => undefined}
      />
    </div>
  );
};

let cyRef: Core;

export const PageConfigBorder: Story = () => {
  const nodeData = [...pageBorderNodes, ...markNodes];
  const edgeData = [...pageBorderEdges, ...lineEdges];

  return (
    <div className="CytoscapeCanvasWrapper" style={{ height: "100vh" }}>
      <CytoscapeCanvas
        nodeData={nodeData}
        edgeData={edgeData}
        diagrams={diagrams}
        onCyInit={(cy) => {
          cyRef = cy;
        }}
        onNodeChange={(data) => console.info("Cytoscape node data changed", data)}
        onEdgeChange={(data) => console.info("Cytoscape edge data changed", data)}
        getContextMenuItems={() => undefined}
      />
    </div>
  );
};

PageConfigBorder.play = async () => {
  await sleep(500);
  const cy = cyRef;
  if (!cy) {
    throw new Error("Cytoscape instance is not available");
  }
  // eslint-disable-next-line testing-library/no-node-access
  const node = cy.getElementById("border_page_no");
  if (!node) {
    throw new Error("Node 'border_page_no' not found");
  }
};

export const RendersSpecifiedLineTypes: StoryObj<typeof CytoscapeCanvas> = {
  render: () => {
    const lineStyles = [
      "solid",
      "peck1",
      "dot1",
      "dot2",
      "arrow1",
      "doubleArrow1",
      "peckDot1",
      "brokenSolid1",
      "brokenPeck1",
      "brokenDot1",
      "brokenDot2",
    ];

    const gap = 2;
    const xStart = 5;
    const yStart = 5;
    const xEnd = 30;

    const builder = fromBuilder();
    lineStyles.forEach((lineStyle, index) => {
      const idFrom = (index + 1) * 10;
      const idTo = (index + 1) * 10 + 1;
      const yPos = -(index * gap + yStart);

      builder.addCooordinate(idFrom, { x: xStart, y: yPos });
      builder.addCooordinate(idTo, { x: xEnd, y: yPos });

      builder.addLine((index + 1) * 1000, [idFrom, idTo], 1, "observation", lineStyle);
      builder.addLabel(
        "lineLabels",
        (index + 1) * 1000 + 1,
        lineStyle,
        { x: xEnd + 2, y: yPos },
        undefined,
        undefined,
        "display",
        "Tahoma",
        14,
      );
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

    const gap = 2;
    const xStart = 10;
    const yStart = 2;
    const columnWidth = 30 / fonts.length;

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

    const gap = 2;

    const builder = fromBuilder();
    borderWidths.forEach((borderWidth, index) => {
      builder.addLabel(
        "labels",
        index * 100,
        `borderWidth: ${borderWidth}`,
        {
          x: 5,
          y: -(5 + index * gap),
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
          x: 20,
          y: -(5 + index * gap),
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
    const displayStates = Object.values(DisplayStateEnum);

    const gap = 2;
    const xStart = 5;
    const yStart = 2;
    const columnWidth = 30 / (effects.length * displayStates.length);

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
            y: -(yStart + effectIdx * gap + 2),
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
        builder.addCooordinate(id + 1, { x: x, y: -(yStart + effectIdx * gap) });
        builder.addCooordinate(id + 2, {
          x: x,
          y: -(yStart + effectIdx * gap + 4),
        });
        builder.addLine(id + 3, [id + 1, id + 2], 5, "observation", "solid");
      });
    });

    builder.addLabel(
      "labels",
      9000001,
      "A",
      {
        x: 10,
        y: -20,
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
        x: 15,
        y: -20,
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
        x: 20,
        y: -20,
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
    const centreX = 5;
    const centreY = -15;

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
          x: centreX + 10,
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
          x: centreX + 20,
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

const addOffsetLabel = (
  builder: PlanDataBuilder,
  idBase: number,
  label: string,
  x: number,
  y: number,
  anchorAngle: number,
  circle: boolean,
) => {
  const pointOffset = (50 * 72) / 96; // 50px in points

  builder.addSymbolLabel(idBase * 100 + 1, "63", {
    x,
    y,
  });
  builder.addRotatedLabel(
    "labels",
    idBase * 100,
    label,
    {
      x,
      y,
    },
    "Arial",
    50,
    0,
    anchorAngle,
    pointOffset,
    circle ? "circle" : undefined,
  );
  builder.addCooordinate(idBase * 100 + 2, { x, y });
  const anchorAngleRads = (anchorAngle * Math.PI) / 180;
  const cmOffset = pointOffset / pointsPerCm;
  builder.addCooordinate(idBase * 100 + 3, {
    x: x + cmOffset * Math.cos(anchorAngleRads),
    y: y + cmOffset * Math.sin(anchorAngleRads),
  });
  builder.addLine(idBase * 100 + 4, [idBase * 100 + 2, idBase * 100 + 3]);
};

export const RendersOffsetCircledLabels: StoryObj<typeof CytoscapeCanvas> = {
  render: () => {
    const builder = fromBuilder();
    addOffsetLabel(builder, 1, "A", 10, -5, 45, true);
    addOffsetLabel(builder, 2, "B", 10, -10, 135, true);
    addOffsetLabel(builder, 3, "C", 10, -15, 225, true);
    addOffsetLabel(builder, 4, "D", 10, -20, 270, true);
    addOffsetLabel(builder, 5, "A", 20, -5, 45, false);
    addOffsetLabel(builder, 6, "B", 20, -10, 135, false);
    addOffsetLabel(builder, 7, "C", 20, -15, 225, false);
    addOffsetLabel(builder, 8, "D", 20, -20, 270, false);
    return <CanvasFromMockData data={builder.build()} />;
  },
  parameters: {
    viewport: {
      defaultViewport: "tablet",
      defaultOrientation: "landscape",
    },
  },
};

const addRotatedLabel = (
  builder: PlanDataBuilder,
  idBase: number,
  label: string,
  x: number,
  y: number,
  rotationAngle: number,
  textAlignment: string,
  circle: boolean,
) => {
  builder.addSymbolLabel(idBase * 100 + 1, "63", {
    x,
    y,
  });
  builder.addLabel("labels", {
    id: idBase * 100,
    displayText: label,
    position: {
      x,
      y,
    },
    font: "Arial",
    fontSize: 50,
    rotationAngle,
    textAlignment,
    symbolType: circle ? "circle" : undefined,
  } as LabelDTO);
};

export const RendersRotatedCircledLabels: StoryObj<typeof CytoscapeCanvas> = {
  render: () => {
    const builder = fromBuilder();
    addRotatedLabel(builder, 1, "A", 10, -5, 45, "centerCenter", false);
    addRotatedLabel(builder, 2, "B", 10, -10, 135, "centerLeft", false);
    addRotatedLabel(builder, 3, "C", 10, -15, 225, "centerRight", false);
    addRotatedLabel(builder, 4, "D", 10, -20, 270, "topLeft", false);
    addRotatedLabel(builder, 5, "A", 20, -5, 45, "centerCenter", true);
    addRotatedLabel(builder, 6, "B", 20, -10, 135, "centerLeft", true);
    addRotatedLabel(builder, 7, "C", 20, -15, 225, "centerRight", true);
    addRotatedLabel(builder, 8, "D", 20, -20, 270, "topLeft", true);
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
    const startX = 5;
    const startY = -5; // room for label
    const xStep = 5;
    const yStep = 2.2;
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
        20,
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

export const RendersCircledLabelsWithTextAlignment: StoryObj<typeof CytoscapeCanvas> = {
  render: () => {
    const startX = 5;
    const startY = -5;
    const xStep = 12;
    const yStep = 8;
    const numColumns = 3;

    const textAlignments = [
      "bottomCenter",
      "bottomLeft",
      "bottomRight",
      "centerCenter",
      "centerLeft",
      "centerRight",
      "topCenter",
      "topLeft",
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
        20,
        "none",
        "display",
        "circle",
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

const renderBoxedUserText = () => {
  const builder = fromBuilder();

  builder.addCooordinate(1, { x: 23.24, y: -14.45 });
  builder.addCooordinate(2, { x: 23.24, y: -14.12 });
  builder.addCooordinate(3, { x: 25.01, y: -14.12 });
  builder.addCooordinate(4, { x: 25.01, y: -14.45 });

  builder.addLine(10, [1, 2]);
  builder.addLine(11, [2, 3]);
  builder.addLine(12, [3, 4]);
  builder.addLine(13, [4, 1]);

  builder.addLabel(
    "labels",
    100,
    "User Text",
    { x: 24.136, y: -14.268 },
    undefined,
    undefined,
    undefined,
    "Tahoma",
    14,
    undefined,
    undefined,
    undefined,
    "centerCenter",
  );

  return <CanvasFromMockData data={builder.build()} />;
};

export const RendersLabelsAtCorrectSizeInLandscape: StoryObj<typeof CytoscapeCanvas> = {
  render: renderBoxedUserText,
  parameters: {
    viewport: {
      type: "tablet",
      defaultOrientation: "landscape",
    },
  },
};

export const RendersLabelsAtCorrectSizeInPortrait: StoryObj<typeof CytoscapeCanvas> = {
  render: renderBoxedUserText,
  parameters: {
    viewport: {
      defaultViewport: "tablet",
      defaultOrientation: "portrait",
    },
  },
};

export const SymbolNodesWithLabels: StoryObj<typeof CytoscapeCanvas> = {
  render: () => {
    const builder = fromBuilder();

    allSymbolCodes.forEach((code, idx) => {
      const ypos = -2 - 2 * idx;

      builder.addSymbolLabel(idx * 10, code.toString(), {
        x: 5,
        y: ypos,
      });
      builder.addLabel(
        "coordinateLabels",
        idx * 10 + 1,
        code.toString(),
        {
          x: 10,
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
        x: 8 + idx * 5 * spacingPixels,
        y: -7.5,
      });
      builder.addSymbolLabel((idx + 1) * 10 + 1, code.toString(), {
        x: 8 + idx * 5 * spacingPixels,
        y: -7.5 - 5 * spacingPixels,
      });
      builder.addLine((idx + 1) * 10 + 2, [(idx + 1) * 10, (idx + 1) * 10 + 1], 0.7);
      if (idx > 0) {
        builder.addLine((idx + 1) * 10 + 3, [idx * 10, (idx + 1) * 10], 0.7);
      }
    });

    return <CanvasFromMockData data={builder.build()} initZoom={{ zoom: 4.0, pan: { x: -600, y: -550 } }} />;
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      defaultOrientation: "landscape",
    },
  },
};

const mockHideMenu = fn();
const mockMenuState: ContextMenuState = {
  visible: true,
  items: [
    { title: "Item 1", callback: fn() },
    { title: "Item 2", callback: fn(), disabled: true },
    { title: "Item 3", callback: fn(), submenu: [{ title: "Subitem 1", callback: fn() }] },
  ],
  position: { x: 100, y: 100 },
  target: null,
  leftMenu: false,
};
const CxtMenuComponent = () => {
  const cytoscapeContext = useContext(CytoscapeContext);

  useEffect(() => {
    if (cytoscapeContext?.cyto) {
      const cy = cytoscapeContext.cyto;
      const node = cy.add({
        group: "nodes",
        data: { id: "D1" },
        position: { x: 100, y: 100 },
      });
      node.trigger("cxttap");
    }
  }, [cytoscapeContext?.cyto]);

  return <CytoscapeContextMenu menuState={mockMenuState} hideMenu={mockHideMenu} />;
};
export const RenderCytoscapeContextMenu: StoryObj<typeof CytoscapeCanvas> = {
  render: () => {
    return <CxtMenuComponent />;
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
      defaultOrientation: "landscape",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const item3 = canvas.getByText("Item 3");
    await userEvent.click(item3);
    // eslint-disable-next-line testing-library/no-node-access
    await expect(item3.closest(".context-menu-item")).toHaveClass("hover");
  },
};
