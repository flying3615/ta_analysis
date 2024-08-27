import { CoordinateDTOCoordTypeEnum, DisplayStateEnum } from "@linz/survey-plan-generation-api-client";

import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder";

import { updateDiagramsWithEdge, updateDiagramsWithNode } from "../updatePlanData";

describe("updatePlanData", () => {
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
    .addCooordinate(10001, {
      x: 20,
      y: -10,
    })
    .addLabel("coordinateLabels", 2, "Label 2", { x: 55, y: -10 }, 10001, "mark", "display", "Arial", 12)
    .addLine(3, [1, 2], 1.0, "observation")
    .build().diagrams;

  test("updateDiagramsWithNode should return diagrams with updated coordinate data", () => {
    const updatedNode = {
      id: "1",
      properties: { diagramId: 1, elementType: "coordinates", coordType: CoordinateDTOCoordTypeEnum.node },
      position: { x: 99, y: -99 },
    } as INodeData;

    const result = updateDiagramsWithNode(diagrams, updatedNode);
    expect(result).toStrictEqual([
      diagrams[0],
      {
        ...diagrams[1],
        coordinates: [
          {
            id: 10001,
            position: {
              x: 20,
              y: -10,
            },
            coordType: CoordinateDTOCoordTypeEnum.node,
          },
        ],
      },
    ]);
  });

  test("updateDiagramsWithNode should return diagrams with updated label data", () => {
    const updatedNode = {
      id: "2",
      label: "Label 2",
      properties: {
        diagramId: 1,
        elementType: "coordinateLabels",
        labelType: "display",
        featureId: 10001,
        featureType: "mark",
        font: "Arial",
        fontSize: 12,
      },
      position: { x: 99, y: -99 },
    } as INodeData;

    const result = updateDiagramsWithNode(diagrams, updatedNode);
    expect(result).toStrictEqual([
      diagrams[0],
      {
        ...diagrams[1],
        coordinateLabels: [
          {
            anchorAngle: 0,
            displayState: DisplayStateEnum.display,
            effect: "none",
            pointOffset: 0,
            rotationAngle: 0,
            userEdited: false,
            id: 2,
            displayText: "Label 2",
            position: {
              x: 99,
              y: -99,
            },
            labelType: "display",
            font: "Arial",
            fontSize: 12,
            featureId: 10001,
            featureType: "mark",
            textAlignment: "centerCenter",
            borderWidth: undefined,
            symbolType: undefined,
          },
        ],
      },
    ]);
  });

  test("updateDiagramsWithEdge should return diagrams with updated line data", () => {
    const updatedEdge = {
      id: "1",
    } as IEdgeData;

    const result = updateDiagramsWithEdge(diagrams, updatedEdge);
    expect(result).toStrictEqual(diagrams);
  });
});
