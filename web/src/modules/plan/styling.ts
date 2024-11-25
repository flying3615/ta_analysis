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

export const GREYED_FOREGROUND_COLOUR = "#B0B0F0";
export const FOREGROUND_COLOUR = "#000";
export const FOREGROUND_COLOUR_BLACK = "#000";
export const ELEMENT_SELECTED_COLOR = "rgba(248, 27, 239, 1)";
export const ELEMENT_HOVERED_COLOR = "#0099FF";

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

const arrowStyles = (line: Omit<LineDTO, "id"> & { id: string | number }, segmentIndex: number) => {
  const lastSegmentIndex = line.coordRefs.length - 2;

  if (line.style === LineStyle.DOUBLE_ARROW_1) {
    //single segment line so arrows as both ends
    if (segmentIndex === 0 && segmentIndex === lastSegmentIndex)
      return { sourceArrowShape: CYTOSCAPE_ARROW_TRIANGLE, targetArrowShape: CYTOSCAPE_ARROW_TRIANGLE };
    //first segment of a multi-segment line so arrow at the source end
    if (segmentIndex === 0) return { sourceArrowShape: CYTOSCAPE_ARROW_TRIANGLE };
    //last segment of a multi-segment line so arrow at the target end
    if (segmentIndex === lastSegmentIndex) return { targetArrowShape: CYTOSCAPE_ARROW_TRIANGLE };
  }

  //arrow at the target end of the last segment (will also catch lines with only one 'segment')
  if (line.style === LineStyle.ARROW1 && segmentIndex === lastSegmentIndex) {
    return { targetArrowShape: CYTOSCAPE_ARROW_TRIANGLE };
  }

  return {};
};

export const getEdgeStyling = (line: Omit<LineDTO, "id"> & { id: string | number }, index: number) => {
  let applyStyle = lineStyleValues[line.style];
  if (!applyStyle) {
    console.warn(`extractEdges: line ${line.id} has unsupported style ${line.style} - will use solid`);
    applyStyle = {};
  }

  const { sourceArrowShape, targetArrowShape } = arrowStyles(line, index);
  return {
    pointWidth: line.pointWidth ?? 1,
    dashStyle: applyStyle?.dashStyle,
    sourceArrowShape,
    targetArrowShape,
    arrowScale: 0.6,
    originalStyle: line.style,
  };
};

export const getTextOutlineOpacity = (label: LabelDTO): number => (label.effect === LabelEffect.HALO.valueOf() ? 1 : 0);

export const isHidden = (label: LabelDTO) =>
  [DisplayStateEnum.hide.valueOf(), DisplayStateEnum.systemHide.valueOf()].includes(label.displayState);

export const getFontColor = (label: LabelDTO): string =>
  isHidden(label) ? GREYED_FOREGROUND_COLOUR : FOREGROUND_COLOUR;

export const getZIndex = (label: LabelDTO): number => (isHidden(label) ? 100 : 200);

export const getIsCircled = (label: LabelDTO): number | undefined =>
  label.symbolType === LABEL_SYMBOL_CIRCLE ? 1 : undefined;
