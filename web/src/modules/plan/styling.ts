import { DisplayStateEnum, LabelDTO, LineDTO } from "@linz/survey-plan-generation-api-client";

export const LineStyle = {
  SOLID: "solid",
  PECK1: "peck1",
  DOT1: "dot1",
  DOT2: "dot2",
  ARROW1: "arrow1",
  DOUBLE_ARROW_1: "doubleArrow1",
  PECK_DOT1: "peckDot1",
  BROKEN_SOLID1: "brokenSolid1",
  BROKEN_PECK1: "brokenPeck1",
  BROKEN_DOT1: "brokenDot1",
  BROKEN_DOT2: "brokenDot2",
} as const;
export type LineStyle = (typeof LineStyle)[keyof typeof LineStyle];

const CYTOSCAPE_ARROW_TRIANGLE = "triangle";

const LABEL_SYMBOL_CIRCLE = "circle";

const GREYED_FOREGROUND_COLOUR = "#B0B0F0";
export const FOREGROUND_COLOUR = "#2121F5";

enum LabelEffect {
  NONE = "none",
  HALO = "halo",
}

interface StyledLineStyle {
  dashStyle?: string;
}

export const getLineDashPattern = (lineStyle: LineStyle, strokeWidth: number = 1, mmWidth = 1): number[] => {
  const twoMmWidth = 2 * mmWidth;
  const dotWidth = strokeWidth;
  switch (lineStyle) {
    case LineStyle.PECK1:
    case LineStyle.BROKEN_PECK1:
      return [twoMmWidth, twoMmWidth];
    case LineStyle.DOT2:
    case LineStyle.DOT1:
    case LineStyle.BROKEN_DOT1:
    case LineStyle.BROKEN_DOT2:
      return [dotWidth, mmWidth];
    case LineStyle.PECK_DOT1:
      return [twoMmWidth, twoMmWidth, dotWidth, twoMmWidth];
    case LineStyle.SOLID:
    case LineStyle.ARROW1:
    case LineStyle.DOUBLE_ARROW_1:
    case LineStyle.BROKEN_SOLID1:
      return [];
    default:
      return [];
  }
};

export const lineStyleValues = {
  [LineStyle.SOLID]: {},
  [LineStyle.PECK1]: { dashStyle: "dashed" },
  [LineStyle.DOT1]: { dashStyle: "dashed" },
  [LineStyle.DOT2]: { dashStyle: "dashed" },
  [LineStyle.PECK_DOT1]: { dashStyle: "dashed" },
  [LineStyle.BROKEN_PECK1]: { dashStyle: "dashed" },
  [LineStyle.BROKEN_DOT1]: { dashStyle: "dashed" },
  [LineStyle.BROKEN_DOT2]: { dashStyle: "dashed" },
  [LineStyle.BROKEN_SOLID1]: {},
  [LineStyle.ARROW1]: {},
  [LineStyle.DOUBLE_ARROW_1]: {},
} as { [key: string]: StyledLineStyle };

const arrowStyles = (line: LineDTO) => {
  if ([LineStyle.ARROW1, LineStyle.DOUBLE_ARROW_1].map((s) => s.valueOf()).includes(line.style)) {
    switch (line.style) {
      case LineStyle.DOUBLE_ARROW_1:
        return { sourceArrowShape: CYTOSCAPE_ARROW_TRIANGLE, targetArrowShape: CYTOSCAPE_ARROW_TRIANGLE };
      case LineStyle.ARROW1:
        return { targetArrowShape: CYTOSCAPE_ARROW_TRIANGLE };
      default:
        return { targetArrowShape: CYTOSCAPE_ARROW_TRIANGLE };
    }
  }
  return {};
};

export const getEdgeStyling = (line: LineDTO) => {
  let applyStyle = lineStyleValues[line.style as string];
  if (!applyStyle) {
    console.warn(`extractEdges: line ${line.id} has unsupported style ${line.style} - will use solid`);
    applyStyle = {};
  }

  const { sourceArrowShape, targetArrowShape } = arrowStyles(line);
  return {
    pointWidth: line.pointWidth ?? 1,
    dashStyle: applyStyle?.dashStyle,
    sourceArrowShape,
    targetArrowShape,
    originalStyle: line.style,
  };
};

export const getTextBackgroundOpacity = (label: LabelDTO): number => (label.effect === LabelEffect.HALO ? 1 : 0);

const isHidden = (label: LabelDTO) =>
  [DisplayStateEnum.hide.valueOf(), DisplayStateEnum.systemHide.valueOf()].includes(label.displayState);

export const getFontColor = (label: LabelDTO): string =>
  isHidden(label) ? GREYED_FOREGROUND_COLOUR : FOREGROUND_COLOUR;

export const getZIndex = (label: LabelDTO): number => (isHidden(label) ? 100 : 200);

export const getIsCircled = (label: LabelDTO): number | undefined =>
  label.symbolType === LABEL_SYMBOL_CIRCLE ? 1 : undefined;
