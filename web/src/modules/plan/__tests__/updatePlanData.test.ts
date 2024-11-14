import {
  CoordinateDTOCoordTypeEnum,
  DisplayStateEnum,
  LabelDTO,
  LabelDTOLabelTypeEnum,
  PageDTO,
} from "@linz/survey-plan-generation-api-client";

import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { LinePropsToUpdate } from "@/components/PlanSheets/properties/LineProperties";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder";

import {
  addPageLabel,
  updateDiagramLabels,
  updateDiagramLines,
  updateDiagramsWithEdge,
  updateDiagramsWithNode,
  updatePageLabels,
  updatePageLines,
  updatePageWithNode,
} from "../updatePlanData";

describe("updatePlanData", () => {
  const planDataBuilder = new PlanDataBuilder()
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
    .addLabel(
      "coordinateLabels",
      2,
      "Label 2",
      { x: 55, y: -10 },
      10001,
      "mark",
      LabelDTOLabelTypeEnum.markDescription,
      "Arial",
      12,
    )
    .addLine(3, [1, 2], 1.0, "observation")
    .addPage(1)
    .addUserCoordinate({
      coordType: CoordinateDTOCoordTypeEnum.userDefined,
      position: { x: 15, y: 10 },
      id: 10002,
    })
    .addUserCoordinate({
      coordType: CoordinateDTOCoordTypeEnum.userDefined,
      position: { x: 15, y: 15 },
      id: 10003,
    })
    .addUserLine({
      lineType: "userDefined",
      style: "solid",
      id: 2,
      coordRefs: [10002, 10003],
    })
    .addUserAnnotation({
      anchorAngle: 0,
      displayState: DisplayStateEnum.display,
      displayText: "Hello!",
      effect: "",
      labelType: LabelDTOLabelTypeEnum.userAnnotation,
      pointOffset: 0,
      position: { x: 17, y: 12 },
      rotationAngle: 0,
      textAlignment: "",
      id: 10002,
    })
    .addUserCoordinate({
      id: 1011,
      coordType: CoordinateDTOCoordTypeEnum.userDefined,
      position: {
        x: 20,
        y: -10,
      },
    })
    .addUserCoordinate({
      id: 1012,
      coordType: CoordinateDTOCoordTypeEnum.userDefined,
      position: {
        x: 20,
        y: -10,
      },
    })
    .addUserCoordinate({
      id: 1013,
      coordType: CoordinateDTOCoordTypeEnum.userDefined,
      position: {
        x: 20,
        y: -10,
      },
    })
    .addUserCoordinate({
      id: 1014,
      coordType: CoordinateDTOCoordTypeEnum.userDefined,
      position: {
        x: 20,
        y: -10,
      },
    })
    .addUserLine({
      id: 1021,
      coordRefs: [1011, 1012],
      lineType: "userDefined",
      style: "arrowhead",
    })
    .addUserLine({
      id: 1022,
      coordRefs: [1013, 1014],
      lineType: "userDefined",
      style: "solid",
    });

  const diagrams = planDataBuilder.build().diagrams;
  const pages = planDataBuilder.build().pages;

  test("updateDiagramsWithNode should return diagrams with updated coordinate data", () => {
    const updatedNode: INodeData = {
      id: "1",
      properties: {
        diagramId: 1,
        elementType: PlanElementType.COORDINATES,
        coordType: CoordinateDTOCoordTypeEnum.node,
      },
      position: { x: 99, y: -99 },
    };

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

  test("updatePagesWithNode should return page with updated coordinate data", () => {
    const updatedNode: INodeData = {
      id: "10002",
      properties: {
        elementType: PlanElementType.COORDINATES,
        coordType: CoordinateDTOCoordTypeEnum.userDefined,
      },
      position: { x: 99, y: -99 },
    };

    const result = updatePageWithNode(pages[0]!, updatedNode);
    const modifiedCoordinate = result.coordinates?.find((c) => c.id === 10002);
    expect(modifiedCoordinate?.position).toStrictEqual({ x: 99, y: -99 });
  });

  test("updatePagesWithNode should return page with updated label data", () => {
    const updatedNode: INodeData = {
      id: "LAB_10002",
      label: "Edited",
      properties: {
        elementType: PlanElementType.LABELS,
        coordType: CoordinateDTOCoordTypeEnum.userDefined,
      },
      position: { x: 88, y: -88 },
    };

    const result = updatePageWithNode(pages[0]!, updatedNode);
    const modifiedLabel = result.labels?.find((c) => c.id === 10002);
    expect(modifiedLabel?.position).toStrictEqual({ x: 88, y: -88 });
    expect(modifiedLabel?.displayText).toBe("Edited");
  });

  test("updateDiagramsWithNode should return diagrams with updated label data", () => {
    const updatedNode: INodeData = {
      id: "LAB_2",
      label: "Label 2",
      properties: {
        diagramId: 2,
        elementType: PlanElementType.COORDINATE_LABELS,
        labelType: LabelDTOLabelTypeEnum.markDescription,
        featureId: 10001,
        featureType: "mark",
        font: "Arial",
        fontSize: 12,
        textRotation: 90,
      },
      position: { x: 99, y: -99 },
    };

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
            rotationAngle: 90,
            id: 2,
            displayText: "Label 2",
            position: {
              x: 99,
              y: -99,
            },
            labelType: LabelDTOLabelTypeEnum.markDescription,
            font: "Arial",
            fontSize: 12,
            featureId: 10001,
            featureType: "mark",
            textAlignment: "centerCenter",
            borderWidth: undefined,
            symbolType: undefined,
          } satisfies LabelDTO,
        ],
      },
    ]);
  });

  test("updateDiagramsWithEdge should return diagrams with updated line data", () => {
    const updatedEdge = {
      id: "1",
      properties: {},
    } as IEdgeData;

    const result = updateDiagramsWithEdge(diagrams, updatedEdge);
    expect(result).toStrictEqual(diagrams);
  });

  test("updateDiagramLabels should return diagrams with updated label data", () => {
    const labelArray = [
      {
        type: {
          diagramId: "2",
          elementType: PlanElementType.COORDINATE_LABELS,
        },
        data: {
          id: 2,
          displayText: "Updated Label 3",
          fontStyle: "bold",
          borderWidth: 1,
          rotationAngle: 45,
        },
      },
    ];

    const result = updateDiagramLabels(diagrams, labelArray);
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
            rotationAngle: 45,
            id: 2,
            displayText: "Updated Label 3",
            position: {
              x: 55,
              y: -10,
            },
            labelType: LabelDTOLabelTypeEnum.markDescription,
            font: "Arial",
            fontSize: 12,
            fontStyle: "bold",
            featureId: 10001,
            featureType: "mark",
            textAlignment: "centerCenter",
            borderWidth: 1,
            symbolType: undefined,
          } satisfies LabelDTO,
        ],
      },
    ]);
  });

  test("updateDiagramLabels should return diagrams unchanged if no matching labels", () => {
    const labelArray = [
      {
        type: {
          diagramId: "1",
          elementType: PlanElementType.COORDINATE_LABELS,
        },
        data: {
          id: 3,
          displayText: "Non-existent Label",
          position: { x: 100, y: -100 },
          rotationAngle: 45,
        },
      },
    ];

    const result = updateDiagramLabels(diagrams, labelArray);
    expect(result).toStrictEqual(diagrams);
  });

  test("updatePageLabels should return page with updated label data", () => {
    const page = {
      labels: [
        {
          id: 1,
          displayText: "Label 1",
          position: { x: 10, y: 10 },
          rotationAngle: 0,
        },
        {
          id: 2,
          displayText: "Label 2",
          position: { x: 20, y: 20 },
          rotationAngle: 0,
        },
      ],
    } as PageDTO;

    const labelPropsArray = [
      {
        id: 1,
        displayText: "Updated Label 1",
        position: { x: 15, y: 15 },
        rotationAngle: 45,
      },
    ];

    const result = updatePageLabels(page, labelPropsArray);
    expect(result).toStrictEqual({
      ...page,
      labels: [
        {
          id: 1,
          displayText: "Updated Label 1",
          position: { x: 15, y: 15 },
          rotationAngle: 45,
        },
        {
          id: 2,
          displayText: "Label 2",
          position: { x: 20, y: 20 },
          rotationAngle: 0,
        },
      ],
    });
  });

  test("updatePageLabels should return page unchanged if no matching labels", () => {
    const page = {
      labels: [
        {
          id: 1,
          displayText: "Label 1",
          position: { x: 10, y: 10 },
          rotationAngle: 0,
        },
        {
          id: 2,
          displayText: "Label 2",
          position: { x: 20, y: 20 },
          rotationAngle: 0,
        },
      ],
    } as PageDTO;

    const labelPropsArray = [
      {
        id: 3,
        displayText: "Non-existent Label",
        position: { x: 100, y: 100 },
        rotationAngle: 45,
      },
    ];

    const result = updatePageLabels(page, labelPropsArray);
    expect(result).toStrictEqual(page);
  });

  test("addPageLabel should add a new label to the page", () => {
    const page = {
      labels: [
        {
          id: 1,
          displayText: "Label 1",
          position: { x: 10, y: 10 },
          rotationAngle: 0,
        },
      ],
    } as PageDTO;

    const labelProps = {
      id: 2,
      displayText: "New Label",
      position: { x: 20, y: 20 },
    };

    const result = addPageLabel(page, labelProps);
    expect(result).toStrictEqual({
      ...page,
      labels: [
        ...(page.labels ?? []),
        {
          anchorAngle: 0,
          displayState: DisplayStateEnum.display,
          effect: "none",
          font: "Tahoma",
          fontSize: 14,
          fontStyle: "italic",
          labelType: LabelDTOLabelTypeEnum.userAnnotation,
          pointOffset: 0,
          rotationAngle: 0,
          textAlignment: "centerCenter",
          ...labelProps,
        },
      ],
    });
  });

  test("addPageLabel should add a new label to an empty page", () => {
    const page = {} as PageDTO;

    const labelProps = {
      id: 1,
      displayText: "New Label",
      position: { x: 20, y: 20 },
    };

    const result = addPageLabel(page, labelProps);
    expect(result).toStrictEqual({
      ...page,
      labels: [
        {
          anchorAngle: 0,
          displayState: DisplayStateEnum.display,
          effect: "none",
          font: "Tahoma",
          fontSize: 14,
          fontStyle: "italic",
          labelType: LabelDTOLabelTypeEnum.userAnnotation,
          pointOffset: 0,
          rotationAngle: 0,
          textAlignment: "centerCenter",
          ...labelProps,
        },
      ],
    });
  });

  test("updatePageLines should return diagrams with updated line data", () => {
    const updatedLine = {
      id: 3,
      pointWidth: 2,
      style: "peck1",
    } as LinePropsToUpdate;

    const result = updateDiagramLines(diagrams, [updatedLine]);
    expect(result[1]?.lines).toStrictEqual([
      {
        id: 3,
        coordRefs: [1, 2],
        lineType: "observation",
        pointWidth: 2,
        style: "peck1",
      },
    ]);
  });

  test("updatePageLines should return pages with updated line data", () => {
    const updatedLine = {
      id: 1021,
      pointWidth: 2,
      style: "peck1",
    } as LinePropsToUpdate;

    const result = updatePageLines(pages[0]!, [updatedLine]);
    expect(result.lines).toStrictEqual([
      {
        id: 2,
        coordRefs: [10002, 10003],
        lineType: "userDefined",
        style: "solid",
      },
      {
        id: 1021,
        coordRefs: [1011, 1012],
        lineType: "userDefined",
        pointWidth: 2,
        style: "peck1",
      },
      {
        id: 1022,
        coordRefs: [1013, 1014],
        lineType: "userDefined",
        style: "solid",
      },
    ]);
  });
});
