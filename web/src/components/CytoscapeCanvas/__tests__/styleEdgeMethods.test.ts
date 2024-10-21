import cytoscape from "cytoscape";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { getEdgeDashPattern } from "@/components/CytoscapeCanvas/styleEdgeMethods";

describe("Dash pattern for edges", () => {
  const peckStyles = ["peck1", "brokenPeck1"];
  it.each(peckStyles)("returns the correct dash pattern for the peck style %s", (style) => {
    let pattern = getEdgeDashPattern(mockCytoscapeEdge(style, 1), mockCytoscapeCoordinateMapper(1));
    expect(pattern).toEqual([2, 2]);
    pattern = getEdgeDashPattern(mockCytoscapeEdge(style, 2), mockCytoscapeCoordinateMapper(2));
    expect(pattern).toEqual([4, 4]);
  });

  const dotStyles = ["dot1", "dot2", "brokenDot1", "brokenDot2"];
  it.each(dotStyles)("returns correct dash pattern for dot style %s", (style) => {
    let pattern = getEdgeDashPattern(mockCytoscapeEdge(style, 1), mockCytoscapeCoordinateMapper(1));
    expect(pattern).toEqual([1, 1]);
    pattern = getEdgeDashPattern(mockCytoscapeEdge(style, 2), mockCytoscapeCoordinateMapper(2));
    expect(pattern).toEqual([2, 2]);
  });

  it("returns correct dash pattern for peckDot1", () => {
    let pattern = getEdgeDashPattern(mockCytoscapeEdge("peckDot1", 1), mockCytoscapeCoordinateMapper(1));
    expect(pattern).toEqual([2, 2, 1, 2]);
    pattern = getEdgeDashPattern(mockCytoscapeEdge("peckDot1", 2), mockCytoscapeCoordinateMapper(2));
    expect(pattern).toEqual([4, 4, 2, 4]);
  });

  const solidLineStyles = ["solid", "arrow1", "doubleArrow1", "brokenSolid1", "unknown"];
  it.each(solidLineStyles)("returns empty array for  %s as it has no dash pattern", (style) => {
    const pattern = getEdgeDashPattern(mockCytoscapeEdge(style, 1), mockCytoscapeCoordinateMapper(1));
    expect(pattern).toEqual([]);
  });
});

const mockCytoscapeCoordinateMapper = (planToCmValue: number): CytoscapeCoordinateMapper => {
  return {
    planCmToCytoscape: jest.fn().mockReturnValue(planToCmValue),
  } as unknown as CytoscapeCoordinateMapper;
};

const mockCytoscapeEdge = (style: string, strokeWidth: number): cytoscape.EdgeSingular => {
  return {
    data: jest.fn().mockReturnValueOnce(style).mockReturnValueOnce(strokeWidth),
  } as unknown as cytoscape.EdgeSingular;
};
