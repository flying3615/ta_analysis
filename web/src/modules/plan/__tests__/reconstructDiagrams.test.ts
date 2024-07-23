import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder";

import { reconstructDiagrams } from "../reconstructDiagrams";

describe("reconstructDiagrams", () => {
  const diagrams = new PlanDataBuilder()
    .addDiagram(
      {
        x: 80,
        y: -90,
      },
      undefined,
      "sysGenPrimaryDiag",
    )
    .addDiagram(
      {
        x: 40,
        y: -20,
      },
      undefined,
      "sysGenTraverseDiag",
    )
    .build().diagrams;

  it("should return the same number of diagrams as provided", () => {
    const result = reconstructDiagrams(diagrams, [], []);

    expect(result).toHaveLength(diagrams.length);
  });

  it("should return diagrams with updated node and edge data", () => {
    const nodeData = [
      {
        id: "1",
        properties: { diagramId: 1, elementType: "coordinates", coordType: "node" },
        position: { x: 10, y: -50 },
      },
      {
        id: "2",
        label: "Node 2",
        properties: { diagramId: 1, elementType: "labels", fontSize: 14, font: "Tahoma" },
        position: { x: 100, y: -20 },
      },
      {
        id: "3",
        label: "Node 3",
        properties: { diagramId: 1, elementType: "coordinateLabels" },
        position: { x: 100, y: -20 },
      },
      {
        id: "4",
        label: "Node 4",
        properties: { diagramId: 2, elementType: "lineLabels" },
        position: { x: 100, y: -20 },
      },
      {
        id: "5",
        label: "Node 5",
        properties: { diagramId: 2, elementType: "parcelLabels" },
        position: { x: 100, y: -20 },
      },
    ] as INodeData[];

    const edgeData = [
      {
        id: "1",
        sourceNodeId: "1",
        destNodeId: "2",
        properties: { diagramId: 1, lineType: "observation", pointWidth: 1, originalStyle: "solid" },
      },
      {
        id: "2",
        sourceNodeId: "4",
        destNodeId: "5",
        properties: { diagramId: 2, lineType: "userDefined", pointWidth: 2, originalStyle: "arrow1" },
      },
    ] as IEdgeData[];

    const result = reconstructDiagrams(diagrams, nodeData, edgeData);

    expect(result).toHaveLength(2);
    expect(result[0]).toStrictEqual({
      id: 1,
      bottomRightPoint: { x: 80, y: -90 },
      originPageOffset: { x: 0, y: 0 },
      coordinates: [{ id: 1, position: { x: 10, y: -50 }, coordType: "node" }],
      labels: [
        {
          id: 2,
          displayText: "Node 2",
          position: { x: 100, y: -20 },
          featureId: undefined,
          featureType: undefined,
          labelType: undefined,
          font: "Tahoma",
          fontSize: 14,
        },
      ],
      lines: [{ id: 1, coordRefs: [1, 2], style: "solid", lineType: "observation", pointWidth: 1 }],
      parcelLabels: [],
      coordinateLabels: [
        {
          id: 3,
          displayText: "Node 3",
          position: { x: 100, y: -20 },
          featureId: undefined,
          featureType: undefined,
          labelType: undefined,
          font: undefined,
          fontSize: undefined,
        },
      ],
      lineLabels: [],
      diagramType: "sysGenPrimaryDiag",
      childDiagrams: [],
    });
    expect(result[1]).toStrictEqual({
      id: 2,
      bottomRightPoint: { x: 40, y: -20 },
      originPageOffset: { x: 0, y: 0 },
      coordinates: [],
      labels: [],
      lines: [{ id: 2, coordRefs: [4, 5], style: "arrow1", lineType: "userDefined", pointWidth: 2 }],
      parcelLabels: [
        {
          id: 5,
          displayText: "Node 5",
          position: { x: 100, y: -20 },
          featureId: undefined,
          featureType: undefined,
          labelType: undefined,
          font: undefined,
          fontSize: undefined,
        },
      ],
      coordinateLabels: [],
      lineLabels: [
        {
          id: 4,
          displayText: "Node 4",
          position: { x: 100, y: -20 },
          featureId: undefined,
          featureType: undefined,
          labelType: undefined,
          font: undefined,
          fontSize: undefined,
        },
      ],
      diagramType: "sysGenTraverseDiag",
      childDiagrams: [],
    });
  });
});
