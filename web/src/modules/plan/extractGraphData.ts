import { IDiagram, ILabel, ILine } from "@linz/survey-plan-generation-api-client";

import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";

export const extractNodes = (diagrams: IDiagram[]): INodeData[] => {
  return diagrams.flatMap((diagram, diagramIndex) => {
    const labelToNode = (label: ILabel) => {
      return {
        id: label.id.toString(),
        position: label.position,
        label: label.displayText,
        diagramIndex,
        properties: {
          labelType: label.labelType,
          font: label.font,
          fontSize: label.fontSize,
          featureId: label.featureId,
          featureType: label.featureType,
        },
      };
    };

    const notSymbol = (label: ILabel) => label.font !== "LOLsymbols";

    return [
      ...diagram.coordinates.map((coordinate) => {
        return {
          id: coordinate.id.toString(),
          position: coordinate.position,
          diagramIndex,
          properties: {
            coordType: coordinate.coordType,
          },
        };
      }),
      ...diagram.labels.filter(notSymbol).map(labelToNode),
      ...diagram.coordinateLabels.filter(notSymbol).map(labelToNode),
      ...diagram.lineLabels.filter(notSymbol).map(labelToNode),
      ...diagram.parcelLabels.filter(notSymbol).map(labelToNode),
    ];
  });
};

export const extractEdges = (diagrams: IDiagram[]): IEdgeData[] => {
  return diagrams.flatMap((diagram, diagramIndex) => {
    return diagram.lines
      .filter((line) => line.coordRefs[0] && line.coordRefs[1])
      .map((line) => {
        let applyStyle = lineStyleDashing[line.style as string];
        if (!applyStyle) {
          console.warn(`extractEdges: line ${line.id} has unsupported style ${line.style} - will use solid`);
          applyStyle = {};
        }
        const dashPattern = scaledDashPattern(applyStyle, line);

        const { sourceArrowShape, targetArrowShape } = arrowStyles(line);

        return {
          id: line.id.toString(),
          sourceNodeId: line.coordRefs[0]?.toString(),
          destNodeId: line.coordRefs[1]?.toString(),
          diagramIndex,
          properties: {
            pointWidth: line.pointWidth ?? 1,
            dashStyle: applyStyle?.dashStyle,
            dashPattern,
            sourceArrowShape,
            targetArrowShape,
          },
        } as IEdgeData;
      });
  });
};

const SOLID = "solid";
const PECK1 = "peck1";
const DOT1 = "dot1";
const DOT2 = "dot2";
const ARROW1 = "arrow1";
const DOUBLE_ARROW_1 = "doubleArrow1";

const CYTOSCAPE_ARROW_TRIANGLE = "triangle";

interface StyledLineStyle {
  dashStyle?: string;
  dashPattern?: number[];
  scaleLineWidth?: boolean;
}

const lineStyleDashing = {
  [SOLID]: {},
  [PECK1]: { dashStyle: "dashed", dashPattern: [3, 6] },
  [DOT1]: { dashStyle: "dashed", dashPattern: [1, 2], scaleLineWidth: true },
  [DOT2]: { dashStyle: "dashed", dashPattern: [1, 2], scaleLineWidth: true },
  [ARROW1]: {},
  [DOUBLE_ARROW_1]: {},
} as { [key: string]: StyledLineStyle };

const arrowStyles = (line: ILine) => {
  if ([ARROW1, DOUBLE_ARROW_1].includes(line.style)) {
    if (line.style === DOUBLE_ARROW_1) {
      return { sourceArrowShape: CYTOSCAPE_ARROW_TRIANGLE, targetArrowShape: CYTOSCAPE_ARROW_TRIANGLE };
    }

    return { targetArrowShape: CYTOSCAPE_ARROW_TRIANGLE };
  }
  return {};
};

// For dot styles, we make the size of the dot scale with the line width
const scaledDashPattern = (applyStyle: StyledLineStyle, line: ILine) =>
  applyStyle?.scaleLineWidth
    ? applyStyle.dashPattern?.map((dimension) => dimension * (line.pointWidth ?? 1))
    : applyStyle?.dashPattern;
