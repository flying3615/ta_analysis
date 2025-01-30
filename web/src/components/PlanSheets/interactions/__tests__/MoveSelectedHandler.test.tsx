import { CoordinateDTO, DisplayStateEnum, LabelDTO } from "@linz/survey-plan-generation-api-client";
import cytoscape, {
  CollectionArgument,
  CollectionBuildingDifferenceFunc,
  CollectionReturnValue,
  EdgeCollection,
  EdgeSingular,
  NodeCollection,
  NodeSingular,
} from "cytoscape";
import { cloneDeep } from "lodash-es";
import { ReactElement } from "react";

import { CSS_PIXELS_PER_CM, CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import {
  getCytoscapeDataToNodeAndEdgeData,
  INodeAndEdgeData,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { SelectedElementProps } from "@/components/PlanSheets/interactions/MoveSelectedHandler";
import { PlanSheetsDispatch } from "@/hooks/usePlanSheetsDispatch";
import { mockPlanDataBuilderDiagram1 } from "@/mocks/data/mockPlanData";
import { calculateLabelBoundingBox, measureTextFallback } from "@/util/labelUtil";
import { Delta, midPoint, Position } from "@/util/positionUtil";

interface CytoscapeNodeData {
  id: string;
  label: string | undefined;
  position: cytoscape.Position;
  diagramId: number | undefined;
  symbolId: string | undefined;
  anchorAngle: number | undefined;
  pointOffset: number | undefined;
  coordType: string | undefined;
}

function expectAllLabelsToBeInBounds(
  updatedElements: Partial<INodeAndEdgeData>,
  cytoCoordMapper: CytoscapeCoordinateMapper,
) {
  updatedElements?.nodes
    ?.filter((n) => n.label)
    ?.forEach((labelNode) => {
      const labelSizeTestApprox = {
        dx: ((labelNode.label?.length ?? 0) * 10) / CSS_PIXELS_PER_CM,
        dy: 10 / CSS_PIXELS_PER_CM,
      };
      const { xL, xR, yT, yB } = calculateLabelBoundingBox(
        cytoCoordMapper.groundCoordToCm(1, labelNode.position),
        labelSizeTestApprox,
        labelNode.properties.textAlignment,
        labelNode.properties.anchorAngle,
        labelNode.properties.pointOffset,
      );
      console.log(`For label ${labelNode.id}, ${labelNode.label}`);
      expect(xL).toBeGreaterThanOrEqual(CytoscapeCoordinateMapper.diagramLimitOriginX);
      expect(xR).toBeLessThanOrEqual(CytoscapeCoordinateMapper.diagramLimitBottomRightX);
      expect(yT).toBeLessThanOrEqual(CytoscapeCoordinateMapper.diagramLimitOriginY);
      expect(yB).toBeGreaterThanOrEqual(CytoscapeCoordinateMapper.diagramLimitBottomRightY);
    });
}

function moveLineInData(
  testNodeData: CytoscapeNodeData[],
  newCytoscapeNode10006Position: cytoscape.Position,
  newCytoscapeNode10005Position: cytoscape.Position,
) {
  testNodeData.forEach((n) => {
    if (["10006", "LAB_10006", "LAB_10007"].includes(n.id)) {
      n.position = newCytoscapeNode10006Position;
    } else {
      n.position = newCytoscapeNode10005Position;
    }
  });
}

function movePointInData(
  node10006CytoscapePosition: cytoscape.Position,
  selectedNodesForLabelMove: CytoscapeNodeData[],
) {
  const newCytoscapePosition = {
    x: node10006CytoscapePosition.x + 20,
    y: node10006CytoscapePosition.y - 15,
  } as cytoscape.Position;
  selectedNodesForLabelMove.forEach((n) => {
    n.position = newCytoscapePosition;
  });
  return newCytoscapePosition;
}

describe("MoveSelectedHandler", () => {
  const planData = mockPlanDataBuilderDiagram1
    .addLabel(
      "coordinateLabels",
      10006,
      "Mark 10006",
      { x: 20, y: -70 },
      10006,
      "mark",
      "markName",
      "Times New Roman",
      10,
    )
    .addSymbolLabel(10007, "96", { x: 20, y: -70 }, 10, 10006)
    .addSymbolLabel(10010, "96", { x: 20, y: -70 }, 10, 10006, DisplayStateEnum.systemHide)
    .addLabel(
      "coordinateLabels",
      10008,
      "Mark 10005",
      { x: 50, y: -70 },
      10005,
      "mark",
      "markName",
      "Times New Roman",
      10,
    )
    .addSymbolLabel(10009, "96", { x: 50, y: -70 }, 10, 10005)
    .addSymbolLabel(10011, "96", { x: 20, y: -70 }, 10, 10006, DisplayStateEnum.systemHide)
    .addRotatedLabel("lineLabels", 15, "Line 1005", { x: 35, y: -70 }, "Arial", 14, 0, 0, 14, undefined, 1005, "Line")
    .addRotatedLabel("lineLabels", 16, "Line 1004", { x: 65, y: -70 }, "Arial", 14, 0, 0, 14, undefined, 1004, "Line")
    .build();

  const useMeasureText =
    () =>
    (text: string, _font: string = "Tahoma", fontSize: number = 12): Delta => {
      return measureTextFallback(text.split("\n"), fontSize);
    };

  jest.doMock("@/hooks/useMeasureText", () => ({ useMeasureText }));

  const eventHandlers = {} as Record<string, (event: Record<string, unknown>) => void>;

  const mouseDownAtPosition = (position: cytoscape.Position) => {
    eventHandlers["mousedown"]?.({
      originalEvent: {},
      position: position,
    });
  };

  const mouseUpAtPosition = (position: cytoscape.Position) => {
    eventHandlers["mouseup"]?.({
      position: position,
    });
  };

  const cyto = {
    on: (eventName: string, eventControlOrHandler: string | (() => void), handler: (() => void) | undefined) => {
      eventHandlers[eventName] = handler ?? (eventControlOrHandler as () => void);
    },
    off: jest.fn(),
    add: jest.fn(),
    boxSelectionEnabled: jest.fn(),
    userPanningEnabled: jest.fn(),
  };

  const cytoCanvas = {
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
    },
  };

  const clientWidth = 400;
  const clientHeight = 300;
  const cytoCoordMapper = new CytoscapeCoordinateMapper(
    { clientWidth: clientWidth, clientHeight: clientHeight } as unknown as HTMLElement,
    planData.diagrams,
  );

  let updatedElements: Partial<INodeAndEdgeData>;
  const updateActiveDiagramsAndPage = (elements: Partial<INodeAndEdgeData>) => {
    updatedElements = elements;
  };

  const cytoDataToNodeAndEdgeData = (cytoscapeData: CollectionReturnValue | EdgeSingular | NodeSingular) => {
    return getCytoscapeDataToNodeAndEdgeData(cytoCoordMapper, cytoscapeData);
  };

  const usePlanSheetsDispatch = () =>
    ({
      cyto,
      cytoCanvas,
      cytoCoordMapper,
      cytoDataToNodeAndEdgeData,
      updateActiveDiagramsAndPage,
    }) as unknown as PlanSheetsDispatch;
  const useAppSelector = () => [planData.diagrams[0]];
  const dispatch = jest.fn();
  const useAppDispatch = jest.fn().mockReturnValue(dispatch);

  let callEffectFn: () => void;
  const useEffect = (effectFn: () => void) => {
    callEffectFn = effectFn;
  };

  jest.doMock("@/hooks/reduxHooks.ts", () => ({ useAppSelector, useAppDispatch }));
  jest.doMock("@/hooks/usePlanSheetsDispatch", () => ({ usePlanSheetsDispatch }));
  jest.doMock("react", () => ({ useEffect }));

  const node10006 = planData.diagrams[0]?.coordinates?.find((c) => c.id === 10006) as CoordinateDTO;
  const node10006CytoscapePosition = cytoCoordMapper.groundCoordToCytoscape(node10006.position, 1);
  const node10005 = planData.diagrams[0]?.coordinates?.find((c) => c.id === 10005) as CoordinateDTO;
  const node10005CytoscapePosition = cytoCoordMapper.groundCoordToCytoscape(node10005.position, 1);

  const mockCytoscapeSelectedElements = (cytoscapeNodeData: CytoscapeNodeData[]) => {
    const mockSelectedElements = cytoscapeNodeData.map((n) => {
      return {
        isNode: () => true,
        isEdge: () => false,
        id: () => n.id,
        select: () => n,
        position: () => n.position,
        classes: () => [],
        data: (arg: undefined | string | Record<string, unknown>) => {
          if (!arg) {
            return n;
          }
          if (typeof arg === "string") {
            return n[arg as keyof typeof n];
          }
          n = {
            ...n,
            ...arg,
          };
          return;
        },
      };
    }) as unknown as CollectionReturnValue;

    mockSelectedElements.cy = () =>
      ({
        collection: () => mockSelectedElements,
      }) as unknown as cytoscape.Core;

    const mockEdgeConnection = [] as unknown as EdgeCollection;
    mockEdgeConnection.addClass = jest.fn();
    mockEdgeConnection.removeClass = jest.fn();
    mockEdgeConnection.difference = (() => mockEdgeConnection) as unknown as CollectionBuildingDifferenceFunc;

    mockSelectedElements.connectedNodes = () => mockSelectedElements as unknown as NodeCollection;
    mockSelectedElements.union = () => mockSelectedElements;
    mockSelectedElements.merge = (n: string | CollectionArgument | CollectionArgument[]) => n as CollectionReturnValue;
    mockSelectedElements.connectedEdges = () => mockEdgeConnection;
    mockSelectedElements.addClass = () =>
      ({
        grabify: jest.fn(),
      }) as unknown as CollectionReturnValue;
    mockSelectedElements.removeClass = jest.fn();
    mockSelectedElements.boundingBox = () => ({
      x1: node10006CytoscapePosition.x - 1,
      y1: -node10006CytoscapePosition.y - 1,
      x2: node10006CytoscapePosition.x + 1,
      y2: -node10006CytoscapePosition.y + 1,
      w: 3,
      h: 3,
    });
    mockSelectedElements.positions = jest.fn();
    return mockSelectedElements;
  };

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MoveSelectedHandler } = require("@/components/PlanSheets/interactions/MoveSelectedHandler") as {
    MoveSelectedHandler: ({ selectedElements }: SelectedElementProps) => ReactElement;
  };

  const coord10006Definition = {
    id: "10006",
    label: undefined,
    position: node10006CytoscapePosition,
    diagramId: 1,
    symbolId: undefined,
    anchorAngle: 0,
    pointOffset: 0,
    coordType: "node",
  };
  const lab10006Definition = {
    id: "LAB_10006",
    label: "Mark 10006",
    position: node10006CytoscapePosition,
    diagramId: 1,
    symbolId: undefined,
    anchorAngle: 0,
    pointOffset: 0,
    coordType: "node",
  };
  const lab10007Definition = {
    id: "LAB_10007",
    label: "96",
    position: node10006CytoscapePosition,
    diagramId: 1,
    symbolId: 96,
    anchorAngle: 0,
    pointOffset: 0,
    coordType: "node",
  };
  const lab10010Definition = {
    id: "LAB_10010",
    label: "96",
    position: node10006CytoscapePosition,
    diagramId: 1,
    symbolId: 96,
    anchorAngle: 0,
    pointOffset: 0,
    coordType: "node",
  };
  const coord10005Definition = {
    id: "10005",
    label: undefined,
    position: node10005CytoscapePosition,
    diagramId: 1,
    symbolId: undefined,
    anchorAngle: 0,
    pointOffset: 0,
    coordType: "node",
  };
  const lab10008Definition = {
    id: "LAB_10008",
    label: "Mark 10005",
    position: node10005CytoscapePosition,
    diagramId: 1,
    symbolId: undefined,
    anchorAngle: 0,
    pointOffset: 0,
    coordType: "node",
  };
  const lab10009Definition = {
    id: "LAB_10009",
    label: "96",
    position: node10005CytoscapePosition,
    diagramId: 1,
    symbolId: 96,
    anchorAngle: 0,
    pointOffset: 0,
    coordType: "node",
  };

  const selectedNodesForMarkMove = [
    { ...coord10006Definition, position: node10006CytoscapePosition },
    { ...lab10006Definition, position: node10006CytoscapePosition },
    { ...lab10007Definition, position: node10006CytoscapePosition },
    { ...lab10010Definition, position: node10006CytoscapePosition },
  ] as CytoscapeNodeData[];

  const node10011 = planData.pages[0]?.coordinates?.find((c) => c.id === 10011) as CoordinateDTO;
  const node10011CytoscapePosition = cytoCoordMapper.planCoordToCytoscape(node10011.position);
  const coord10011Definition = {
    id: "10011",
    label: undefined,
    position: node10011CytoscapePosition,
    symbolId: undefined,
    anchorAngle: 0,
    pointOffset: 0,
    coordType: "userDefined",
  };

  const node10012 = planData.pages[0]?.coordinates?.find((c) => c.id === 10012) as CoordinateDTO;
  const node10012CytoscapePosition = cytoCoordMapper.planCoordToCytoscape(node10012.position);
  const coord10012Definition = {
    id: "10012",
    label: undefined,
    position: node10012CytoscapePosition,
    symbolId: undefined,
    anchorAngle: 0,
    pointOffset: 0,
    coordType: "userDefined",
  };

  const selectedNodesForLineMove = [
    coord10006Definition,
    coord10005Definition,
    lab10006Definition,
    lab10007Definition,
    lab10009Definition,
    lab10008Definition,
  ] as CytoscapeNodeData[];

  test("can move a mark coordinate", () => {
    expect(node10006?.id).toBe(10006);

    const testNodeData = cloneDeep(selectedNodesForMarkMove);
    const mockSelectedElements = mockCytoscapeSelectedElements(testNodeData);

    MoveSelectedHandler({ selectedElements: mockSelectedElements });

    callEffectFn();

    mouseDownAtPosition(node10006CytoscapePosition);

    const newCytoscapePosition = movePointInData(node10006CytoscapePosition, testNodeData);

    mouseUpAtPosition(newCytoscapePosition);

    expect(updatedElements?.nodes).toHaveLength(6); // 1 mark and 3 mark labels and 2 edge labels
    const newGroundPosition = cytoCoordMapper.cytoscapeToGroundCoord(newCytoscapePosition, 1);
    expect(updatedElements?.nodes?.[0]?.id).toBe("10006");
    expect(updatedElements?.nodes?.[0]?.position).toEqual(newGroundPosition);

    expect(updatedElements?.nodes?.[0]?.id).toBe("10006");
    expect(updatedElements?.nodes?.[0]?.label).toBeUndefined();
    expect(updatedElements?.nodes?.[0]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[0]?.properties?.pointOffset).toBe(0);
    expect(updatedElements?.nodes?.[1]?.id).toBe("LAB_10006");
    expect(updatedElements?.nodes?.[1]?.label).toBe("Mark 10006");
    expect(updatedElements?.nodes?.[1]?.position).toEqual(newGroundPosition);
    // Mark labels (including symbols) stay at the updated node position and retain any anchor and offset

    expect(updatedElements?.nodes?.[1]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[1]?.properties?.pointOffset).toBe(0);
    expect(updatedElements?.nodes?.[2]?.id).toBe("LAB_10007");
    expect(updatedElements?.nodes?.[2]?.label).toBe("96");
    expect(updatedElements?.nodes?.[2]?.position).toEqual(newGroundPosition);

    expect(updatedElements?.nodes?.[2]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[2]?.properties?.pointOffset).toBe(0);
    expect(updatedElements?.nodes?.[3]?.id).toBe("LAB_10010");
    expect(updatedElements?.nodes?.[3]?.label).toBe("96");
    expect(updatedElements?.nodes?.[3]?.position).toEqual(newGroundPosition);

    expect(updatedElements?.nodes?.[3]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[3]?.properties?.pointOffset).toBe(0);

    // Line labels get shifted to centre of moved line
    expect(updatedElements?.nodes?.[4]?.id).toBe("LAB_13");
    expect(updatedElements?.nodes?.[4]?.label).toBe("Label 13");
    const node10001GroundPosition = planData.diagrams[0]?.coordinates?.find((c) => c.id === 10001)?.position;
    const expectedGroundPosition13 = midPoint(
      node10001GroundPosition as Position,
      cytoCoordMapper.cytoscapeToGroundCoord(newCytoscapePosition, 1),
    );
    const node10005GroundPosition = planData.diagrams[0]?.coordinates?.find((c) => c.id === 10005)?.position;
    const expectedGroundPosition1005 = midPoint(
      node10005GroundPosition as Position,
      cytoCoordMapper.cytoscapeToGroundCoord(newCytoscapePosition, 1),
    );

    expect(updatedElements?.nodes?.[4]?.position?.x).toBeCloseTo(expectedGroundPosition13.x, 1);
    expect(updatedElements?.nodes?.[4]?.position?.y).toBeCloseTo(expectedGroundPosition13.y, 1);

    expect(updatedElements?.nodes?.[4]?.properties?.anchorAngle).toBeCloseTo(9.9, 1);
    expect(updatedElements?.nodes?.[4]?.properties?.pointOffset).toBeCloseTo(14, 1);
    expect(updatedElements?.nodes?.[4]?.properties?.textRotation).toBeCloseTo(279.9, 1);

    expect(updatedElements?.nodes?.[5]?.id).toBe("LAB_15");
    expect(updatedElements?.nodes?.[5]?.label).toBe("Line 1005");
    expect(updatedElements?.nodes?.[5]?.position?.x).toBeCloseTo(expectedGroundPosition1005.x, 1);
    expect(updatedElements?.nodes?.[5]?.position?.y).toBeCloseTo(expectedGroundPosition1005.y, 1);

    expect(updatedElements?.nodes?.[5]?.properties?.anchorAngle).toBeCloseTo(341.6, 1);
    expect(updatedElements?.nodes?.[5]?.properties?.pointOffset).toBeCloseTo(14, 1);
    expect(updatedElements?.nodes?.[5]?.properties?.textRotation).toBeCloseTo(341.6, 1);
  });

  test("can move a label", () => {
    expect(node10006?.id).toBe(10006);

    const selectedNodesForLabelMove = [
      { ...lab10006Definition, position: node10006CytoscapePosition },
    ] as CytoscapeNodeData[];

    const mockSelectedElements = mockCytoscapeSelectedElements(selectedNodesForLabelMove);

    MoveSelectedHandler({ selectedElements: mockSelectedElements });

    callEffectFn();

    mouseDownAtPosition(node10006CytoscapePosition);
    const newCytoscapePosition = movePointInData(node10006CytoscapePosition, selectedNodesForLabelMove);
    mouseUpAtPosition(newCytoscapePosition);

    expect(updatedElements?.nodes).toHaveLength(1); // just the label
    expect(updatedElements?.nodes?.[0]?.id).toBe("LAB_10006");
    expect(updatedElements?.nodes?.[0]?.label).toBe("Mark 10006");
    // We convert position shifts in normalizePlanData now
    expect(updatedElements?.nodes?.[0]?.position).toEqual(
      cytoCoordMapper.cytoscapeToGroundCoord(newCytoscapePosition, 1),
    );
    expect(updatedElements?.nodes?.[0]?.properties?.anchorAngle).toBeCloseTo(0, 1);
    expect(updatedElements?.nodes?.[0]?.properties?.pointOffset).toBeCloseTo(0, 1);
  });

  test("can move a line", () => {
    const testNodeData = cloneDeep(selectedNodesForLineMove);
    const mockSelectedElements = mockCytoscapeSelectedElements(testNodeData);

    MoveSelectedHandler({ selectedElements: mockSelectedElements });

    callEffectFn();

    mouseDownAtPosition(node10006CytoscapePosition);

    const newCytoscapeNode10006Position = {
      x: node10006CytoscapePosition.x + 20,
      y: node10006CytoscapePosition.y - 15,
    } as cytoscape.Position;
    const newCytoscapeNode10005Position = {
      x: node10005CytoscapePosition.x + 20,
      y: node10005CytoscapePosition.y - 15,
    } as cytoscape.Position;
    moveLineInData(testNodeData, newCytoscapeNode10006Position, newCytoscapeNode10005Position);

    mouseUpAtPosition(newCytoscapeNode10006Position);

    expect(updatedElements?.nodes).toHaveLength(9); // 2 marks, 4 mark labels, 3 line labels

    const newNode10006GroundPosition = cytoCoordMapper.cytoscapeToGroundCoord(newCytoscapeNode10006Position, 1);
    expect(updatedElements?.nodes?.[0]?.position).toEqual(newNode10006GroundPosition);

    expect(updatedElements?.nodes?.[0]?.id).toBe("10006");
    expect(updatedElements?.nodes?.[0]?.label).toBeUndefined();
    expect(updatedElements?.nodes?.[0]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[0]?.properties?.pointOffset).toBe(0);

    const newNode10005GroundPosition = cytoCoordMapper.cytoscapeToGroundCoord(newCytoscapeNode10005Position, 1);
    expect(updatedElements?.nodes?.[1]?.position).toEqual(newNode10005GroundPosition);

    expect(updatedElements?.nodes?.[1]?.id).toBe("10005");
    expect(updatedElements?.nodes?.[1]?.label).toBeUndefined();
    expect(updatedElements?.nodes?.[1]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[1]?.properties?.pointOffset).toBe(0);

    // Mark labels (including symbols) stay at the updated node position and retain any anchor and offset
    expect(updatedElements?.nodes?.[2]?.id).toBe("LAB_10006");
    expect(updatedElements?.nodes?.[2]?.label).toBe("Mark 10006");
    expect(updatedElements?.nodes?.[2]?.position).toEqual(newNode10006GroundPosition);

    expect(updatedElements?.nodes?.[2]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[2]?.properties?.pointOffset).toBe(0);
    expect(updatedElements?.nodes?.[3]?.id).toBe("LAB_10007");
    expect(updatedElements?.nodes?.[3]?.label).toBe("96");
    expect(updatedElements?.nodes?.[3]?.position).toEqual(newNode10006GroundPosition);

    expect(updatedElements?.nodes?.[3]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[3]?.properties?.pointOffset).toBe(0);

    expect(updatedElements?.nodes?.[4]?.id).toBe("LAB_10009");
    expect(updatedElements?.nodes?.[4]?.label).toBe("96");
    expect(updatedElements?.nodes?.[4]?.position).toEqual(newNode10005GroundPosition);

    expect(updatedElements?.nodes?.[4]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[4]?.properties?.pointOffset).toBe(0);

    expect(updatedElements?.nodes?.[5]?.id).toBe("LAB_10008");
    expect(updatedElements?.nodes?.[5]?.label).toBe("Mark 10005");
    expect(updatedElements?.nodes?.[5]?.position).toEqual(newNode10005GroundPosition);

    expect(updatedElements?.nodes?.[5]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[5]?.properties?.pointOffset).toBe(0);

    // Line labels get shifted to centre of moved lines
    expect(updatedElements?.nodes?.[6]?.id).toBe("LAB_13");
    expect(updatedElements?.nodes?.[6]?.label).toBe("Label 13");
    const node10001GroundPosition = planData.diagrams[0]?.coordinates?.find((c) => c.id === 10001)?.position;
    const node10004GroundPosition = planData.diagrams[0]?.coordinates?.find((c) => c.id === 10004)?.position;
    const expectedGroundPosition13 = midPoint(node10001GroundPosition as Position, newNode10006GroundPosition);
    const expectedGroundPosition1005 = midPoint(newNode10005GroundPosition as Position, newNode10006GroundPosition);
    const expectedGroundPosition1004 = midPoint(node10004GroundPosition as Position, newNode10005GroundPosition);

    expect(updatedElements?.nodes?.[6]?.position?.x).toBeCloseTo(expectedGroundPosition13.x, 1);
    expect(updatedElements?.nodes?.[6]?.position?.y).toBeCloseTo(expectedGroundPosition13.y, 1);

    expect(updatedElements?.nodes?.[6]?.properties?.anchorAngle).toBeCloseTo(9.9, 1);
    expect(updatedElements?.nodes?.[6]?.properties?.pointOffset).toBeCloseTo(14, 1);
    expect(updatedElements?.nodes?.[6]?.properties?.textRotation).toBeCloseTo(279.9, 1);

    expect(updatedElements?.nodes?.[7]?.id).toBe("LAB_15");
    expect(updatedElements?.nodes?.[7]?.label).toBe("Line 1005");
    expect(updatedElements?.nodes?.[7]?.position?.x).toBeCloseTo(expectedGroundPosition1005.x, 1);
    expect(updatedElements?.nodes?.[7]?.position?.y).toBeCloseTo(expectedGroundPosition1005.y, 1);

    expect(updatedElements?.nodes?.[7]?.properties?.anchorAngle).toBeCloseTo(0, 1);
    expect(updatedElements?.nodes?.[7]?.properties?.pointOffset).toBeCloseTo(14, 1);
    expect(updatedElements?.nodes?.[7]?.properties?.textRotation).toBeCloseTo(0, 1);

    expect(updatedElements?.nodes?.[8]?.id).toBe("LAB_16");
    expect(updatedElements?.nodes?.[8]?.label).toBe("Line 1004");
    expect(updatedElements?.nodes?.[8]?.position?.x).toBeCloseTo(expectedGroundPosition1004.x, 1);
    expect(updatedElements?.nodes?.[8]?.position?.y).toBeCloseTo(expectedGroundPosition1004.y, 1);

    expect(updatedElements?.nodes?.[8]?.properties?.anchorAngle).toBeCloseTo(341.6, 1);
    expect(updatedElements?.nodes?.[8]?.properties?.pointOffset).toBeCloseTo(14, 1);
    expect(updatedElements?.nodes?.[8]?.properties?.textRotation).toBeCloseTo(341.6, 1);
  });

  test("can move multiple mark coordinates", () => {
    expect(node10005?.id).toBe(10005);
    expect(node10006?.id).toBe(10006);

    const selectedNodesForMarksMove = [
      { ...coord10005Definition, position: node10005CytoscapePosition },
      { ...coord10006Definition, position: node10006CytoscapePosition },
      { ...lab10006Definition, position: node10006CytoscapePosition },
      { ...lab10007Definition, position: node10006CytoscapePosition },
      lab10008Definition,
      lab10009Definition,
    ] as CytoscapeNodeData[];

    const mockSelectedElements = mockCytoscapeSelectedElements(selectedNodesForMarksMove);

    MoveSelectedHandler({ selectedElements: mockSelectedElements });

    callEffectFn();

    mouseDownAtPosition(node10005CytoscapePosition);

    const newCytoscapeNode10006Position = {
      x: node10006CytoscapePosition.x + 20,
      y: node10006CytoscapePosition.y - 15,
    } as cytoscape.Position;
    const newCytoscapeNode10005Position = {
      x: node10005CytoscapePosition.x + 20,
      y: node10005CytoscapePosition.y - 15,
    } as cytoscape.Position;
    selectedNodesForMarksMove.forEach((n) => {
      if (["10006", "LAB_10006", "LAB_10007"].includes(n.id)) {
        n.position = newCytoscapeNode10006Position;
      } else {
        n.position = newCytoscapeNode10005Position;
      }
    });

    mouseUpAtPosition(newCytoscapeNode10005Position);
    expect(updatedElements?.nodes).toHaveLength(9); // 2 marks, 4 mark labels, 3 edge labels

    const node10005GroundPosition = cytoCoordMapper.cytoscapeToGroundCoord(newCytoscapeNode10005Position, 1);
    expect(updatedElements?.nodes?.[0]?.position).toEqual(node10005GroundPosition);

    expect(updatedElements?.nodes?.[0]?.id).toBe("10005");
    expect(updatedElements?.nodes?.[0]?.label).toBeUndefined();
    expect(updatedElements?.nodes?.[0]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[0]?.properties?.pointOffset).toBe(0);

    const node10006GroundPosition = cytoCoordMapper.cytoscapeToGroundCoord(newCytoscapeNode10006Position, 1);
    expect(updatedElements?.nodes?.[1]?.position).toEqual(node10006GroundPosition);

    expect(updatedElements?.nodes?.[1]?.id).toBe("10006");
    expect(updatedElements?.nodes?.[1]?.label).toBeUndefined();
    expect(updatedElements?.nodes?.[1]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[1]?.properties?.pointOffset).toBe(0);

    // Mark labels (including symbols) stay at the updated node position and retain any anchor and offset
    expect(updatedElements?.nodes?.[2]?.id).toBe("LAB_10006");
    expect(updatedElements?.nodes?.[2]?.label).toBe("Mark 10006");
    expect(updatedElements?.nodes?.[2]?.position).toEqual(node10006GroundPosition);

    expect(updatedElements?.nodes?.[2]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[2]?.properties?.pointOffset).toBe(0);
    expect(updatedElements?.nodes?.[3]?.id).toBe("LAB_10007");
    expect(updatedElements?.nodes?.[3]?.label).toBe("96");
    expect(updatedElements?.nodes?.[3]?.position).toEqual(node10006GroundPosition);

    expect(updatedElements?.nodes?.[3]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[3]?.properties?.pointOffset).toBe(0);

    expect(updatedElements?.nodes?.[5]?.id).toBe("LAB_10009");
    expect(updatedElements?.nodes?.[5]?.label).toBe("96");
    expect(updatedElements?.nodes?.[5]?.position).toEqual(node10005GroundPosition);

    expect(updatedElements?.nodes?.[5]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[5]?.properties?.pointOffset).toBe(0);

    expect(updatedElements?.nodes?.[4]?.id).toBe("LAB_10008");
    expect(updatedElements?.nodes?.[4]?.label).toBe("Mark 10005");
    expect(updatedElements?.nodes?.[4]?.position).toEqual(node10005GroundPosition);

    expect(updatedElements?.nodes?.[4]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[4]?.properties?.pointOffset).toBe(0);

    // Line labels get shifted to centre of moved lines
    expect(updatedElements?.nodes?.[6]?.id).toBe("LAB_13");
    expect(updatedElements?.nodes?.[6]?.label).toBe("Label 13");
    const node10001GroundPosition = planData.diagrams[0]?.coordinates?.find((c) => c.id === 10001)?.position;
    const node10004GroundPosition = planData.diagrams[0]?.coordinates?.find((c) => c.id === 10004)?.position;
    const expectedGroundPosition13 = midPoint(node10001GroundPosition as Position, node10006GroundPosition);
    const expectedGroundPosition1005 = midPoint(node10005GroundPosition as Position, node10006GroundPosition);
    const expectedGroundPosition1004 = midPoint(node10004GroundPosition as Position, node10005GroundPosition);

    expect(updatedElements?.nodes?.[6]?.position?.x).toBeCloseTo(expectedGroundPosition13.x, 1);
    expect(updatedElements?.nodes?.[6]?.position?.y).toBeCloseTo(expectedGroundPosition13.y, 1);

    expect(updatedElements?.nodes?.[6]?.properties?.anchorAngle).toBeCloseTo(9.9, 1);
    expect(updatedElements?.nodes?.[6]?.properties?.pointOffset).toBeCloseTo(14, 1);
    expect(updatedElements?.nodes?.[6]?.properties?.textRotation).toBeCloseTo(279.9, 1);

    expect(updatedElements?.nodes?.[7]?.id).toBe("LAB_15");
    expect(updatedElements?.nodes?.[7]?.label).toBe("Line 1005");
    expect(updatedElements?.nodes?.[7]?.position?.x).toBeCloseTo(expectedGroundPosition1005.x, 1);
    expect(updatedElements?.nodes?.[7]?.position?.y).toBeCloseTo(expectedGroundPosition1005.y, 1);

    expect(updatedElements?.nodes?.[7]?.properties?.anchorAngle).toBeCloseTo(0, 1);
    expect(updatedElements?.nodes?.[7]?.properties?.pointOffset).toBeCloseTo(14, 1);
    expect(updatedElements?.nodes?.[7]?.properties?.textRotation).toBeCloseTo(0, 1);

    expect(updatedElements?.nodes?.[8]?.id).toBe("LAB_16");
    expect(updatedElements?.nodes?.[8]?.label).toBe("Line 1004");
    expect(updatedElements?.nodes?.[8]?.position?.x).toBeCloseTo(expectedGroundPosition1004.x, 1);
    expect(updatedElements?.nodes?.[8]?.position?.y).toBeCloseTo(expectedGroundPosition1004.y, 1);

    expect(updatedElements?.nodes?.[8]?.properties?.anchorAngle).toBeCloseTo(341.6, 1);
    expect(updatedElements?.nodes?.[8]?.properties?.pointOffset).toBeCloseTo(14, 1);
    expect(updatedElements?.nodes?.[8]?.properties?.textRotation).toBeCloseTo(341.6, 1);
  });

  test("can move multiple labels", () => {
    const node13 = planData.diagrams[0]?.lineLabels?.find((c) => c.id === 13) as LabelDTO;
    const node13CytoscapePosition = cytoCoordMapper.groundCoordToCytoscape(node13.position, 1);
    const node15 = planData.diagrams[0]?.lineLabels?.find((c) => c.id === 15) as LabelDTO;
    const node15CytoscapePosition = cytoCoordMapper.groundCoordToCytoscape(node15.position, 1);

    const selectedNodesForLabelsMove = [
      {
        id: "LAB_13",
        label: "Label 13",
        position: node13CytoscapePosition,
        diagramId: 1,
        symbolId: undefined,
        anchorAngle: 0,
        pointOffset: 0,
        coordType: "node",
      },
      { ...lab10006Definition, position: node10006CytoscapePosition },
      {
        id: "LAB_15",
        label: "Line 1005",
        position: node10005CytoscapePosition,
        diagramId: 1,
        symbolId: undefined,
        anchorAngle: 0,
        pointOffset: 0,
        coordType: "node",
      },
    ] as CytoscapeNodeData[];

    const mockSelectedElements = mockCytoscapeSelectedElements(selectedNodesForLabelsMove);

    MoveSelectedHandler({ selectedElements: mockSelectedElements });

    callEffectFn();

    mouseDownAtPosition(node13CytoscapePosition);

    const newCytoscapeNode13Position = {
      x: node13CytoscapePosition.x + 20,
      y: node13CytoscapePosition.y - 15,
    } as cytoscape.Position;
    const newCytoscapeNode15Position = {
      x: node15CytoscapePosition.x + 20,
      y: node15CytoscapePosition.y - 15,
    } as cytoscape.Position;
    const newCytoscapeNode10006Position = {
      x: node10006CytoscapePosition.x + 20,
      y: node10006CytoscapePosition.y - 15,
    } as cytoscape.Position;
    selectedNodesForLabelsMove.forEach((n) => {
      switch (n.id) {
        case "LAB_13":
          n.position = newCytoscapeNode13Position;
          break;
        case "LAB_15":
          n.position = newCytoscapeNode15Position;
          break;
        case "LAB_10006":
          n.position = newCytoscapeNode10006Position;
          break;
        default:
          break;
      }
    });

    mouseUpAtPosition(newCytoscapeNode13Position);

    expect(updatedElements?.nodes).toHaveLength(3); // 2 line labels, 1 mark label

    const node13GroundPosition = cytoCoordMapper.cytoscapeToGroundCoord(newCytoscapeNode13Position, 1);
    expect(updatedElements?.nodes?.[0]?.position).toEqual(node13GroundPosition);
    expect(updatedElements?.nodes?.[0]?.id).toBe("LAB_13");
    expect(updatedElements?.nodes?.[0]?.label).toBe("Label 13");
    expect(updatedElements?.nodes?.[0]?.properties?.anchorAngle).toBeCloseTo(0, 1);
    expect(updatedElements?.nodes?.[0]?.properties?.pointOffset).toBeCloseTo(0, 1);

    const node10006GroundPosition = cytoCoordMapper.cytoscapeToGroundCoord(newCytoscapeNode10006Position, 1);
    expect(updatedElements?.nodes?.[1]?.position).toEqual(node10006GroundPosition);
    expect(updatedElements?.nodes?.[1]?.id).toBe("LAB_10006");
    expect(updatedElements?.nodes?.[1]?.label).toBe("Mark 10006");
    expect(updatedElements?.nodes?.[1]?.properties?.anchorAngle).toBeCloseTo(0, 1);
    expect(updatedElements?.nodes?.[1]?.properties?.pointOffset).toBeCloseTo(0, 1);

    const node15GroundPosition = cytoCoordMapper.cytoscapeToGroundCoord(newCytoscapeNode15Position, 1);
    expect(updatedElements?.nodes?.[2]?.position).toEqual(node15GroundPosition);
    expect(updatedElements?.nodes?.[2]?.id).toBe("LAB_15");
    expect(updatedElements?.nodes?.[2]?.label).toBe("Line 1005");
    expect(updatedElements?.nodes?.[2]?.properties?.anchorAngle).toBeCloseTo(0, 1);
    expect(updatedElements?.nodes?.[2]?.properties?.pointOffset).toBeCloseTo(0, 1);
  });

  test("can move a user-defined line", () => {
    const selectedNodesForUserDefinedLineMove = [coord10011Definition, coord10012Definition] as CytoscapeNodeData[];
    const mockSelectedElements = mockCytoscapeSelectedElements(selectedNodesForUserDefinedLineMove);

    MoveSelectedHandler({ selectedElements: mockSelectedElements });

    callEffectFn();

    mouseDownAtPosition(node10011CytoscapePosition);

    const newCytoscapeNode10011Position = {
      x: node10011CytoscapePosition.x + 5,
      y: node10011CytoscapePosition.y - 10,
    } as cytoscape.Position;
    const newCytoscapeNode10012Position = {
      x: node10012CytoscapePosition.x + 5,
      y: node10012CytoscapePosition.y - 10,
    } as cytoscape.Position;
    selectedNodesForUserDefinedLineMove.forEach((n) => {
      switch (n.id) {
        case "10011":
          n.position = newCytoscapeNode10011Position;
          break;
        case "10012":
          n.position = newCytoscapeNode10012Position;
          break;
        default:
          break;
      }
    });

    mouseUpAtPosition(newCytoscapeNode10011Position);

    expect(updatedElements?.nodes).toHaveLength(2); // 2 line nodes

    expect(updatedElements?.nodes?.[0]?.id).toBe("10011");
    const node10011GroundPosition = cytoCoordMapper.cytoscapeToPlanCoord(newCytoscapeNode10011Position);
    expect(updatedElements?.nodes?.[0]?.position).toEqual(node10011GroundPosition);

    expect(updatedElements?.nodes?.[0]?.properties?.diagramId).toBeUndefined();
    expect(updatedElements?.nodes?.[0]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[0]?.properties?.pointOffset).toBe(0);

    expect(updatedElements?.nodes?.[1]?.id).toBe("10012");
    const node10012GroundPosition = cytoCoordMapper.cytoscapeToPlanCoord(newCytoscapeNode10012Position);
    expect(updatedElements?.nodes?.[1]?.position).toEqual(node10012GroundPosition);

    expect(updatedElements?.nodes?.[1]?.properties?.diagramId).toBeUndefined();
    expect(updatedElements?.nodes?.[1]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[1]?.properties?.pointOffset).toBe(0);
  });

  test("can move a user-defined label", () => {
    const node23 = planData.pages[0]?.labels?.find((c) => c.id === 23) as LabelDTO;
    const node23CytoscapePosition = cytoCoordMapper.pageLabelCoordToCytoscape(node23.position);

    const selectedNodesForLabelMove = [
      {
        id: "LAB_23",
        label: "Rotated user added text",
        position: node23CytoscapePosition,
        diagramId: undefined,
        symbolId: undefined,
        anchorAngle: 0,
        pointOffset: 0,
        coordType: "node",
      },
    ] as CytoscapeNodeData[];

    const mockSelectedElements = mockCytoscapeSelectedElements(selectedNodesForLabelMove);

    MoveSelectedHandler({ selectedElements: mockSelectedElements });

    callEffectFn();

    mouseDownAtPosition(node23CytoscapePosition);

    const newCytoscapePosition = {
      x: node23CytoscapePosition.x + 20,
      y: node23CytoscapePosition.y - 15,
    } as cytoscape.Position;
    selectedNodesForLabelMove.forEach((n) => {
      n.position = newCytoscapePosition;
    });

    mouseUpAtPosition(newCytoscapePosition);

    expect(updatedElements?.nodes).toHaveLength(1); // just the label
    expect(updatedElements?.nodes?.[0]?.id).toBe("LAB_23");
    const pageLabelPositionMetres = cytoCoordMapper.pageLabelCytoscapeToCoord(newCytoscapePosition);
    const pageLabelPositionCm = { x: pageLabelPositionMetres.x * 100, y: pageLabelPositionMetres.y * 100 };
    expect(updatedElements?.nodes?.[0]?.position?.x).toBeCloseTo(pageLabelPositionCm.x);
    expect(updatedElements?.nodes?.[0]?.position?.y).toBeCloseTo(pageLabelPositionCm.y);
    expect(updatedElements?.nodes?.[0]?.label).toBe("Rotated user added text");
    expect(updatedElements?.nodes?.[0]?.properties?.anchorAngle).toBeCloseTo(0, 1);
    expect(updatedElements?.nodes?.[0]?.properties?.pointOffset).toBeCloseTo(0, 1);
  });

  test("when moving a mark coordinate places a label outside bounds, adjusts that position", () => {
    expect(node10006?.id).toBe(10006);

    const testNodeData = cloneDeep(selectedNodesForMarkMove);
    const mockSelectedElements = mockCytoscapeSelectedElements(testNodeData);

    MoveSelectedHandler({ selectedElements: mockSelectedElements });

    callEffectFn();

    mouseDownAtPosition(node10006CytoscapePosition);

    // This pushes the mark label out of bounds but not the symbol
    const newCytoscapePosition = {
      x: clientWidth - 20,
      y: node10006CytoscapePosition.y - 15,
    } as cytoscape.Position;
    testNodeData.forEach((n) => {
      n.position = newCytoscapePosition;
    });

    mouseUpAtPosition(newCytoscapePosition);

    expect(updatedElements?.nodes).toHaveLength(6); // 1 mark and 3 mark labels and 2 edge labels
    expectAllLabelsToBeInBounds(updatedElements, cytoCoordMapper);
  });

  test("when moving a line places a line label out of bounds, adjusts that labels position", () => {
    const testNodeData = cloneDeep(selectedNodesForLineMove);
    const mockSelectedElements = mockCytoscapeSelectedElements(testNodeData);

    MoveSelectedHandler({ selectedElements: mockSelectedElements });

    callEffectFn();

    mouseDownAtPosition(node10006CytoscapePosition);

    const newCytoscapeNode10006Position = {
      x: node10006CytoscapePosition.x,
      y: clientHeight - 70,
    } as cytoscape.Position;
    const newCytoscapeNode10005Position = {
      x: node10005CytoscapePosition.x,
      y: clientHeight - 60,
    } as cytoscape.Position;
    moveLineInData(testNodeData, newCytoscapeNode10006Position, newCytoscapeNode10005Position);

    mouseUpAtPosition(newCytoscapeNode10006Position);

    expect(updatedElements?.nodes).toHaveLength(9); // 2 marks, 4 mark labels, 3 line labels
    expectAllLabelsToBeInBounds(updatedElements, cytoCoordMapper);
  });
});
