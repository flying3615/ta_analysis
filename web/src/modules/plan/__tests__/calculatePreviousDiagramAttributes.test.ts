import {
  calculatePreviousDiagramAttributes,
  PageEdgeData,
  PageNodeData,
} from "@/modules/plan/calculatePreviousDiagramAttributes";

describe("calculatePreviousDiagramAttributes labels", () => {
  it("should return the label id if its position is within the diagram bounding box", () => {
    const diagramPoints = { x1: 0, y1: 0, x2: 100, y2: 100 };
    const pageLabelNodes = [{ id: "1", position: { x: 50, y: 50 } }];
    const pageLineEdges: PageEdgeData[] = [];
    const result = calculatePreviousDiagramAttributes("1", diagramPoints, pageLineEdges, pageLabelNodes);
    expect(result.labelsAffectedByLastMove).toEqual([{ id: "1" }]);
  });

  it("should return an empty array if the label position is outside the diagram bounding box", () => {
    const diagramPoints = { x1: 0, y1: 0, x2: 100, y2: 100 };
    const pageLabelNodes = [{ id: "1", position: { x: 101, y: 101 } }];
    const pageLineEdges: PageEdgeData[] = [];
    const result = calculatePreviousDiagramAttributes("1", diagramPoints, pageLineEdges, pageLabelNodes);
    expect(result.labelsAffectedByLastMove).toEqual([]);
  });
});

describe("calculatePreviousDiagramAttributes lines", () => {
  it("should return the line id if its bounding box overlaps with the diagram bounding box", () => {
    const diagramPoints = { x1: 0, y1: 0, x2: 100, y2: 100 };
    const pageLabelNodes: PageNodeData[] = [];
    const pageLineEdges = [{ id: "1_1", boundingBox: { x1: 50, y1: 50, x2: 60, y2: 60 } }];
    const result = calculatePreviousDiagramAttributes("1", diagramPoints, pageLineEdges, pageLabelNodes);
    expect(result.linesAffectedByLastMove).toEqual([{ id: "1" }]);
  });

  it("should return line if its bounding box partially overlaps with the diagram bounding box", () => {
    const diagramPoints = { x1: 0, y1: 0, x2: 100, y2: 100 };
    const pageLabelNodes: PageNodeData[] = [];
    const pageLineEdges = [{ id: "1_1", boundingBox: { x1: 99, y1: 99, x2: 110, y2: 110 } }];
    const result = calculatePreviousDiagramAttributes("1", diagramPoints, pageLineEdges, pageLabelNodes);
    expect(result.linesAffectedByLastMove).toEqual([{ id: "1" }]);
  });

  it.each([
    { x1: 101, y1: 101, x2: 110, y2: 110 },
    { x1: 40, y1: 0, x2: 110, y2: 49 }, // above
    { x1: 0, y1: 50, x2: 49, y2: 110 }, // left
    { x1: 101, y1: 50, x2: 150, y2: 110 }, // right
    { x1: 50, y1: 101, x2: 110, y2: 150 }, // below
  ])(
    `should return an empty array if the line bounding box %o does not overlap with the diagram bounding box`,
    (boundingBox) => {
      const diagramPoints = { x1: 50, y1: 50, x2: 100, y2: 100 };
      const pageLabelNodes: PageNodeData[] = [];
      const pageLineEdges = [{ id: "1_1", boundingBox }];
      const result = calculatePreviousDiagramAttributes("1", diagramPoints, pageLineEdges, pageLabelNodes);
      expect(result.linesAffectedByLastMove).toEqual([]);
    },
  );

  it("should only return one line id if multiple edges of a singular line overlap with the diagram bounding box", () => {
    const diagramPoints = { x1: 0, y1: 0, x2: 100, y2: 100 };
    const pageLabelNodes: PageNodeData[] = [];
    const pageLineEdges = [
      { id: "1_1", boundingBox: { x1: 50, y1: 50, x2: 60, y2: 60 } },
      { id: "1_2", boundingBox: { x1: 50, y1: 50, x2: 60, y2: 60 } },
    ];
    const result = calculatePreviousDiagramAttributes("1", diagramPoints, pageLineEdges, pageLabelNodes);
    expect(result.linesAffectedByLastMove).toEqual([{ id: "1" }]);
  });
});
