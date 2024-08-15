import cytoscape from "cytoscape";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import { getEdgeDashPattern } from "@/components/CytoscapeCanvas/styleEdgeMethods.ts";

describe("Dash pattern for edges", () => {
  it("returns the correct dash pattern for the peck lines", () => {
    let pattern = getEdgeDashPattern(mockCytoscapeEdge("peck1", 2), mockCytoscapeCoordinateMapper(1));
    expect(pattern).toEqual([2, 2]);
    pattern = getEdgeDashPattern(mockCytoscapeEdge("peck1", 2), mockCytoscapeCoordinateMapper(2));
    expect(pattern).toEqual([4, 4]);

    pattern = getEdgeDashPattern(mockCytoscapeEdge("brokenPeck1", 2), mockCytoscapeCoordinateMapper(1));
    expect(pattern).toEqual([2, 2]);
    pattern = getEdgeDashPattern(mockCytoscapeEdge("brokenPeck1", 2), mockCytoscapeCoordinateMapper(2));
    expect(pattern).toEqual([4, 4]);
  });

  it("returns correct dash pattern for dots", () => {
    let pattern = getEdgeDashPattern(mockCytoscapeEdge("dot1", 1), mockCytoscapeCoordinateMapper(1));
    expect(pattern).toEqual([1, 1]);
    pattern = getEdgeDashPattern(mockCytoscapeEdge("dot1", 2), mockCytoscapeCoordinateMapper(2));
    expect(pattern).toEqual([2, 2]);

    pattern = getEdgeDashPattern(mockCytoscapeEdge("dot2", 1), mockCytoscapeCoordinateMapper(1));
    expect(pattern).toEqual([1, 1]);
    pattern = getEdgeDashPattern(mockCytoscapeEdge("dot2", 2), mockCytoscapeCoordinateMapper(2));
    expect(pattern).toEqual([2, 2]);
  });
  it("returns correct dash pattern for peckDot1", () => {
    let pattern = getEdgeDashPattern(mockCytoscapeEdge("peckDot1", 1), mockCytoscapeCoordinateMapper(1));
    expect(pattern).toEqual([2, 2, 1, 2]);
    pattern = getEdgeDashPattern(mockCytoscapeEdge("peckDot1", 2), mockCytoscapeCoordinateMapper(2));
    expect(pattern).toEqual([4, 4, 2, 4]);
  });

  it("returns empty array if style has no dash pattern", () => {
    const lineStyles = ["solid", "arrow1", "doubleArrow1", "brokenSolid1", "unknown"];
    lineStyles.forEach((style) => {
      const pattern = getEdgeDashPattern(mockCytoscapeEdge(style, 1), mockCytoscapeCoordinateMapper(1));
      expect(pattern).toEqual([]);
    });
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
