import cytoscape from "cytoscape";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import { getLineDashPattern, LineStyle } from "@/modules/plan/styling.ts";

export const getEdgeDashPattern = (
  ele: cytoscape.EdgeSingular,
  cytoscapeCoordinateMapper: CytoscapeCoordinateMapper,
): number[] => {
  const lineStyle = ele.data("originalStyle") as LineStyle;
  const strokeWidth = ele.data("strokeWidth") as number;
  const mmToCytoscapePixels = Math.ceil(cytoscapeCoordinateMapper.planCmToCytoscape(0.1));
  return getLineDashPattern(lineStyle, strokeWidth, mmToCytoscapePixels);
};
