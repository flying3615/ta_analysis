import { ILine } from "@linz/survey-plan-generation-api-client";

import { IEdgeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";

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

export const getEdgeStyling = (line: ILine) => {
  let applyStyle = lineStyleDashing[line.style as string];
  if (!applyStyle) {
    console.warn(`extractEdges: line ${line.id} has unsupported style ${line.style} - will use solid`);
    applyStyle = {};
  }
  const dashPattern = scaledDashPattern(applyStyle, line);

  const { sourceArrowShape, targetArrowShape } = arrowStyles(line);

  return {
    pointWidth: line.pointWidth ?? 1,
    dashStyle: applyStyle?.dashStyle,
    dashPattern,
    sourceArrowShape,
    targetArrowShape,
    originalStyle: line.style,
  };
};

export const getLineStyling = (edge: IEdgeData): Partial<ILine> => {
  const pointWidth = edge.properties?.["pointWidth"];
  if (typeof pointWidth !== "number") {
    throw new Error(`getLineStyling: pointWidth is not a number: ${pointWidth}`);
  }

  const style = edge.properties?.["originalStyle"];
  if (typeof style !== "string") {
    throw new Error(`getLineStyling: style is not a string: ${style}`);
  }

  return { pointWidth, style };
};
