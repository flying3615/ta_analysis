import cytoscape from "cytoscape";

import { diagrams } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import {
  edgeDefinitionsFromData,
  getEdgeData,
  getNodeData,
  IEdgeData,
  INodeData,
  nodeDefinitionsFromData,
  nodePositionsFromData,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";
import { edgeSingular, nodeSingular } from "@/test-utils/cytoscape-utils";

const inputNodes = [
  { id: "node1", label: "Node 1", properties: { a: 1, diagramId: 1 }, position: { x: 10, y: -50 } },
  { id: "node2", properties: { b: 2, diagramId: 1 }, position: { x: 100, y: -20 } },
] as INodeData[];

describe("nodeDefinitionsFromData", () => {
  test("creates cytoscape node definitions including root node", () => {
    const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(
      { clientWidth: 300, clientHeight: 500 } as HTMLElement,
      diagrams,
    );
    const cytoscapeNodes = nodeDefinitionsFromData(inputNodes, cytoscapeCoordinateMapper);

    expect(cytoscapeNodes).toHaveLength(3);
    expect(cytoscapeNodes[0]?.data?.id).toBe("root");
    expect(cytoscapeNodes[1]?.data?.id).toBe("node1");
    expect(cytoscapeNodes[1]?.data?.["label"]).toBe("Node 1");
    expect((cytoscapeNodes[1]?.data as unknown as Record<string, number>)["a"]).toBe(1);
    expect(cytoscapeNodes[2]?.data?.id).toBe("node2");
    expect((cytoscapeNodes[2]?.data as unknown as Record<string, number>)["b"]).toBe(2);
  });
});

describe("getNodeData", () => {
  test("gets node data for a node", () => {
    const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(
      { clientWidth: 300, clientHeight: 500 } as HTMLElement,
      diagrams,
    );

    const node1 = nodeSingular(
      { id: "1", label: "Node 1", "font-family": "Tahoma", "font-size": 16, diagramId: 1 },
      { x: 100, y: -20 },
      { "text-rotation": "60deg" },
    );
    const node1Data = getNodeData(node1, cytoscapeCoordinateMapper);
    expect(node1Data).toStrictEqual({
      id: "1",
      label: "Node 1",
      properties: { diagramId: 1, textRotation: "60" },
      position: { x: 14.903, y: 1.355 },
    });

    const node2 = nodeSingular({ id: "2", "font-family": "Arial", "font-size": 12, diagramId: 1 }, { x: 10, y: -50 });
    const node2Data = getNodeData(node2, cytoscapeCoordinateMapper);
    expect(node2Data).toStrictEqual({
      id: "2",
      properties: { diagramId: 1 },
      position: { x: 2.71, y: 5.419 },
    });
  });
});

const inputEdges = [
  { id: "edge1", sourceNodeId: "node1", destNodeId: "node2", properties: { a: 1, diagramId: 1 } },
] as IEdgeData[];

describe("edgeDefinitionsFromData", () => {
  test("creates cytoscape edge definitions", () => {
    const cytoscapeEdges = edgeDefinitionsFromData(inputEdges);

    expect(cytoscapeEdges).toHaveLength(1);
    expect(cytoscapeEdges[0]?.data?.id).toBe("edge1");
    expect(cytoscapeEdges[0]?.data?.source).toBe("node1");
    expect(cytoscapeEdges[0]?.data?.target).toBe("node2");
    expect((cytoscapeEdges[0]?.data as unknown as Record<string, number>)["a"]).toBe(1);
  });
});

describe("getEdgeData", () => {
  test("gets edge data for a edge", () => {
    const edge = edgeSingular({
      id: "1",
      source: "node1",
      target: "node2",
      properties: { a: 1, diagramId: 1 },
    });
    const edgeData = getEdgeData(edge);
    expect(edgeData).toStrictEqual({
      id: "1",
      label: undefined,
      properties: { a: 1, diagramId: 1 },
      sourceNodeId: "node1",
      destNodeId: "node2",
    });
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
    const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(
      { clientWidth: 500, clientHeight: 300 } as HTMLElement,
      diagrams,
    );
    const cytoscapePositions = nodePositionsFromData(inputNodes, cytoscapeCoordinateMapper);
    console.log(JSON.stringify(cytoscapePositions));
    expect(cytoscapePositions["node1"]?.x).toBeCloseTo(94.4, 1);
    expect(cytoscapePositions["node1"]?.y).toBeCloseTo(511.9, 1);
    expect(cytoscapePositions["node2"]?.x).toBeCloseTo(1033.8, 1);
    expect(cytoscapePositions["node2"]?.y).toBeCloseTo(198.8, 1);
    validateShapeNotDistorted(cytoscapePositions);
  });

  test("creates cytoscape NodePositionMap from node positions converting coordinates for tall display", () => {
    const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(
      { clientWidth: 300, clientHeight: 500 } as HTMLElement,
      diagrams,
    );
    const cytoscapePositions = nodePositionsFromData(inputNodes, cytoscapeCoordinateMapper);
    expect(cytoscapePositions["node1"]?.x).toBeCloseTo(63.8, 1);
    expect(cytoscapePositions["node1"]?.y).toBeCloseTo(359, 1);
    expect(cytoscapePositions["node2"]?.x).toBeCloseTo(728.1, 1);
    expect(cytoscapePositions["node2"]?.y).toBeCloseTo(137.61, 1);
    validateShapeNotDistorted(cytoscapePositions);
  });
});
