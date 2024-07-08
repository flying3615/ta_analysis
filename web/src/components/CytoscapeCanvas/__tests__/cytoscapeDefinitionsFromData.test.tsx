import { diagrams } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import {
  edgeDefinitionsFromData,
  IEdgeData,
  INodeData,
  nodeDefinitionsFromData,
  nodePositionsFromData,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";

const inputNodes = [
  { id: "node1", label: "Node 1", diagramIndex: 0, properties: { a: 1 }, position: { x: 10, y: -50 } },
  { id: "node2", diagramIndex: 0, properties: { b: 2 }, position: { x: 100, y: -20 } },
] as INodeData[];

describe("nodeDefinitionsFromData", () => {
  test("creates cytoscape node definitions including root node", () => {
    const cytoscapeNodes = nodeDefinitionsFromData(inputNodes);

    expect(cytoscapeNodes).toHaveLength(3);
    expect(cytoscapeNodes[0]?.data?.id).toBe("root");
    expect(cytoscapeNodes[1]?.data?.id).toBe("node1");
    expect(cytoscapeNodes[1]?.data?.["label"]).toBe("Node 1");
    expect((cytoscapeNodes[1]?.data as unknown as Record<string, number>)["a"]).toBe(1);
    expect(cytoscapeNodes[2]?.data?.id).toBe("node2");
    expect((cytoscapeNodes[2]?.data as unknown as Record<string, number>)["b"]).toBe(2);
  });
});

describe("edgeDefinitionsFromData", () => {
  test("creates cytoscape edge definitions", () => {
    const inputEdges = [
      { id: "edge1", sourceNodeId: "node1", destNodeId: "node2", diagramIndex: 0, properties: { a: 1 } },
    ] as IEdgeData[];

    const cytoscapeEdges = edgeDefinitionsFromData(inputEdges);

    expect(cytoscapeEdges).toHaveLength(1);
    expect(cytoscapeEdges[0]?.data?.id).toBe("edge1");
    expect(cytoscapeEdges[0]?.data?.source).toBe("node1");
    expect(cytoscapeEdges[0]?.data?.target).toBe("node2");
    expect((cytoscapeEdges[0]?.data as unknown as Record<string, number>)["a"]).toBe(1);
  });
});

describe("nodePositionsFromData", () => {
  const validateShapeNotDistorted = (cytoscapePositions: cytoscape.NodePositionMap) => {
    // and shape is not distorted
    const scaleX =
      ((cytoscapePositions["node2"]?.x ?? 0) - (cytoscapePositions["node1"]?.x ?? 0)) /
      ((inputNodes[1]?.position?.x ?? 0) - (inputNodes[0]?.position?.x ?? 0));
    const scaleY =
      ((cytoscapePositions["node2"]?.y ?? 0) - (cytoscapePositions["node1"]?.y ?? 0)) /
      ((inputNodes[1]?.position?.y ?? 0) - (inputNodes[0]?.position?.y ?? 0));
    expect(scaleX).toBeCloseTo(-scaleY);
  };

  test("creates cytoscape NodePositionMap from node positions converting coordinates for wide display", () => {
    const cytoscapePositions = nodePositionsFromData(inputNodes, { width: 500, height: 300 }, diagrams);

    expect(cytoscapePositions["node1"]?.x).toBeCloseTo(15.71, 1);
    expect(cytoscapePositions["node1"]?.y).toBeCloseTo(14.55, 1);
    expect(cytoscapePositions["node2"]?.x).toBeCloseTo(42.71, 1);
    expect(cytoscapePositions["node2"]?.y).toBeCloseTo(5.55, 1);
    validateShapeNotDistorted(cytoscapePositions);
  });

  test("creates cytoscape NodePositionMap from node positions converting coordinates for tall display", () => {
    const cytoscapePositions = nodePositionsFromData(inputNodes, { width: 300, height: 500 }, diagrams);

    expect(cytoscapePositions["node1"]?.x).toBeCloseTo(1.6, 1);
    expect(cytoscapePositions["node1"]?.y).toBeCloseTo(164.2, 1);
    expect(cytoscapePositions["node2"]?.x).toBeCloseTo(18.7, 1);
    expect(cytoscapePositions["node2"]?.y).toBeCloseTo(158.5, 1);
    validateShapeNotDistorted(cytoscapePositions);
  });
});
