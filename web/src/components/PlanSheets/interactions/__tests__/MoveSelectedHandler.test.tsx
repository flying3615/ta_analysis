import { CoordinateDTO } from "@linz/survey-plan-generation-api-client";
import cytoscape, {
  CollectionArgument,
  CollectionBuildingDifferenceFunc,
  CollectionReturnValue,
  EdgeCollection,
  EdgeSingular,
  NodeCollection,
  NodeSingular,
} from "cytoscape";
import { ReactElement } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import {
  getCytoscapeDataToNodeAndEdgeData,
  INodeAndEdgeData,
} from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { SelectedElementProps } from "@/components/PlanSheets/interactions/MoveSelectedHandler";
import { PlanSheetsDispatch } from "@/hooks/usePlanSheetsDispatch";
import { mockPlanDataBuilderDiagram1 } from "@/mocks/data/mockPlanData";
import { midPoint, Position } from "@/util/positionUtil";

interface CytoscapeNodeData {
  id: string;
  label: string | undefined;
  position: cytoscape.Position;
  diagramId: number;
  symbolId: string | undefined;
  anchorAngle: number | undefined;
  pointOffset: number | undefined;
  coordType: string | undefined;
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
    .addRotatedLabel("lineLabels", 15, "Line 1005", { x: 35, y: -70 }, "Arial", 14, 0, 0, 14, undefined, 1005, "Line")
    .addRotatedLabel("lineLabels", 16, "Line 1004", { x: 65, y: -70 }, "Arial", 14, 0, 0, 14, undefined, 1004, "Line")
    .build();

  const eventHandlers = {} as Record<string, (event: Record<string, unknown>) => void>;

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

  const cytoCoordMapper = new CytoscapeCoordinateMapper(
    { clientWidth: 400, clientHeight: 300 } as unknown as HTMLElement,
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

  let callEffectFn: () => void;
  const useEffect = (effectFn: () => void) => {
    callEffectFn = effectFn;
  };

  jest.doMock("@/hooks/reduxHooks.ts", () => ({ useAppSelector }));
  jest.doMock("@/hooks/usePlanSheetsDispatch", () => ({ usePlanSheetsDispatch }));
  jest.doMock("react", () => ({ useEffect }));

  const node10006 = planData.diagrams[0]?.coordinates?.find((c) => c.id === 10006) as CoordinateDTO;
  const node10006CytoscapePosition = cytoCoordMapper.groundCoordToCytoscape(node10006.position, 1);

  const mockCytoscapeSelectedElements = (cytoscapeNodeData: CytoscapeNodeData[]) => {
    const mockSelectedElements = cytoscapeNodeData.map((n) => {
      return {
        isNode: () => true,
        isEdge: () => false,
        id: () => n.id,
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

  test("can move a mark coordinate", () => {
    expect(node10006?.id).toBe(10006);

    const selectedNodesForMarkMove = [
      {
        id: 10006,
        label: undefined,
        position: node10006CytoscapePosition,
        diagramId: 1,
        symbolId: undefined,
        anchorAngle: 0,
        pointOffset: 0,
        coordType: "node",
      },
      {
        id: "LAB_10006",
        label: "Mark 10006",
        position: node10006CytoscapePosition,
        diagramId: 1,
        symbolId: undefined,
        anchorAngle: 0,
        pointOffset: 0,
        coordType: "node",
      },
      {
        id: "LAB_10007",
        label: "96",
        position: node10006CytoscapePosition,
        diagramId: 1,
        symbolId: 96,
        anchorAngle: 0,
        pointOffset: 0,
        coordType: "node",
      },
    ] as CytoscapeNodeData[];

    const mockSelectedElements = mockCytoscapeSelectedElements(selectedNodesForMarkMove);

    MoveSelectedHandler({ selectedElements: mockSelectedElements });

    callEffectFn();

    eventHandlers["mousedown"]?.({
      originalEvent: {},
      position: node10006CytoscapePosition,
    });

    const newCytoscapePosition = {
      x: node10006CytoscapePosition.x + 20,
      y: node10006CytoscapePosition.y - 15,
    } as cytoscape.Position;
    selectedNodesForMarkMove.forEach((n) => {
      n.position = newCytoscapePosition;
    });

    eventHandlers["mouseup"]?.({
      position: newCytoscapePosition,
    });

    expect(updatedElements?.nodes).toHaveLength(5); // 1 mark and 2 mark labels and 2 edge labels
    const newGroundPosition = cytoCoordMapper.cytoscapeToGroundCoord(newCytoscapePosition, 1);
    expect(updatedElements?.nodes?.[0]?.position).toEqual(newGroundPosition);
    expect(updatedElements?.nodes?.[0]?.properties?.ignorePositionChange).toBeFalsy();
    expect(updatedElements?.nodes?.[0]?.id).toBe(10006);
    expect(updatedElements?.nodes?.[0]?.label).toBeUndefined();
    expect(updatedElements?.nodes?.[0]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[0]?.properties?.pointOffset).toBe(0);
    expect(updatedElements?.nodes?.[1]?.id).toBe("LAB_10006");
    expect(updatedElements?.nodes?.[1]?.label).toBe("Mark 10006");
    expect(updatedElements?.nodes?.[1]?.position).toEqual(newGroundPosition);
    // Mark labels (including symbols) stay at the updated node position and retain any anchor and offset
    expect(updatedElements?.nodes?.[1]?.properties?.ignorePositionChange).toBeFalsy();
    expect(updatedElements?.nodes?.[1]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[1]?.properties?.pointOffset).toBe(0);
    expect(updatedElements?.nodes?.[2]?.id).toBe("LAB_10007");
    expect(updatedElements?.nodes?.[2]?.label).toBe("96");
    expect(updatedElements?.nodes?.[2]?.position).toEqual(newGroundPosition);
    expect(updatedElements?.nodes?.[2]?.properties?.ignorePositionChange).toBeFalsy();
    expect(updatedElements?.nodes?.[2]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[2]?.properties?.pointOffset).toBe(0);

    // Line labels get shifted to centre of moved line
    expect(updatedElements?.nodes?.[3]?.id).toBe("LAB_13");
    expect(updatedElements?.nodes?.[3]?.label).toBe("Label 13");
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

    expect(updatedElements?.nodes?.[3]?.position?.x).toBeCloseTo(expectedGroundPosition13.x, 1);
    expect(updatedElements?.nodes?.[3]?.position?.y).toBeCloseTo(expectedGroundPosition13.y, 1);
    expect(updatedElements?.nodes?.[3]?.properties?.ignorePositionChange).toBeFalsy();
    expect(updatedElements?.nodes?.[3]?.properties?.anchorAngle).toBeCloseTo(189.9, 1);
    expect(updatedElements?.nodes?.[3]?.properties?.pointOffset).toBeCloseTo(14, 1);
    expect(updatedElements?.nodes?.[3]?.properties?.textRotation).toBeCloseTo(99.9, 1);

    expect(updatedElements?.nodes?.[4]?.id).toBe("LAB_15");
    expect(updatedElements?.nodes?.[4]?.label).toBe("Line 1005");
    expect(updatedElements?.nodes?.[4]?.position?.x).toBeCloseTo(expectedGroundPosition1005.x, 1);
    expect(updatedElements?.nodes?.[4]?.position?.y).toBeCloseTo(expectedGroundPosition1005.y, 1);
    expect(updatedElements?.nodes?.[4]?.properties?.ignorePositionChange).toBeFalsy();
    expect(updatedElements?.nodes?.[4]?.properties?.anchorAngle).toBeCloseTo(161.6, 1);
    expect(updatedElements?.nodes?.[4]?.properties?.pointOffset).toBeCloseTo(14, 1);
    expect(updatedElements?.nodes?.[4]?.properties?.textRotation).toBeCloseTo(161.6, 1);
  });

  test("can move a label", () => {
    expect(node10006?.id).toBe(10006);

    const selectedNodesForLabelMove = [
      {
        id: "LAB_10006",
        label: "Mark 10006",
        position: node10006CytoscapePosition,
        diagramId: 1,
        symbolId: undefined,
        anchorAngle: 0,
        pointOffset: 0,
        coordType: "node",
      },
    ] as CytoscapeNodeData[];

    const mockSelectedElements = mockCytoscapeSelectedElements(selectedNodesForLabelMove);

    MoveSelectedHandler({ selectedElements: mockSelectedElements });

    callEffectFn();

    eventHandlers["mousedown"]?.({
      originalEvent: {},
      position: node10006CytoscapePosition,
    });

    const newCytoscapePosition = {
      x: node10006CytoscapePosition.x + 20,
      y: node10006CytoscapePosition.y - 15,
    } as cytoscape.Position;
    selectedNodesForLabelMove.forEach((n) => {
      n.position = newCytoscapePosition;
    });

    eventHandlers["mouseup"]?.({
      position: newCytoscapePosition,
    });

    expect(updatedElements?.nodes).toHaveLength(1); // just the label
    expect(updatedElements?.nodes?.[0]?.properties?.ignorePositionChange).toBeTruthy();
    expect(updatedElements?.nodes?.[0]?.id).toBe("LAB_10006");
    expect(updatedElements?.nodes?.[0]?.label).toBe("Mark 10006");
    expect(updatedElements?.nodes?.[0]?.properties?.anchorAngle).toBeCloseTo(36.9, 1);
    expect(updatedElements?.nodes?.[0]?.properties?.pointOffset).toBeCloseTo(72.6, 1);
  });

  test("can move a line", () => {
    const node10005 = planData.diagrams[0]?.coordinates?.find((c) => c.id === 10005) as CoordinateDTO;
    const node10005CytoscapePosition = cytoCoordMapper.groundCoordToCytoscape(node10005.position, 1);

    const selectedNodesForLineMove = [
      {
        id: "10006",
        label: undefined,
        position: node10006CytoscapePosition,
        diagramId: 1,
        symbolId: undefined,
        anchorAngle: 0,
        pointOffset: 0,
        coordType: "node",
      },
      {
        id: "10005",
        label: undefined,
        position: node10005CytoscapePosition,
        diagramId: 1,
        symbolId: undefined,
        anchorAngle: 0,
        pointOffset: 0,
        coordType: "node",
      },
      {
        id: "LAB_10006",
        label: "Mark 10006",
        position: node10006CytoscapePosition,
        diagramId: 1,
        symbolId: undefined,
        anchorAngle: 0,
        pointOffset: 0,
        coordType: "node",
      },
      {
        id: "LAB_10007",
        label: "96",
        position: node10006CytoscapePosition,
        diagramId: 1,
        symbolId: 96,
        anchorAngle: 0,
        pointOffset: 0,
        coordType: "node",
      },
      {
        id: "LAB_10009",
        label: "96",
        position: node10005CytoscapePosition,
        diagramId: 1,
        symbolId: 96,
        anchorAngle: 0,
        pointOffset: 0,
        coordType: "node",
      },
      {
        id: "LAB_10008",
        label: "Mark 10005",
        position: node10005CytoscapePosition,
        diagramId: 1,
        symbolId: undefined,
        anchorAngle: 0,
        pointOffset: 0,
        coordType: "node",
      },
    ] as CytoscapeNodeData[];

    const mockSelectedElements = mockCytoscapeSelectedElements(selectedNodesForLineMove);

    MoveSelectedHandler({ selectedElements: mockSelectedElements });

    callEffectFn();

    eventHandlers["mousedown"]?.({
      originalEvent: {},
      position: node10006CytoscapePosition,
    });

    const newCytoscapeNode10006Position = {
      x: node10006CytoscapePosition.x + 20,
      y: node10006CytoscapePosition.y - 15,
    } as cytoscape.Position;
    const newCytoscapeNode10005Position = {
      x: node10005CytoscapePosition.x + 20,
      y: node10005CytoscapePosition.y - 15,
    } as cytoscape.Position;
    selectedNodesForLineMove.forEach((n) => {
      if (["10006", "LAB_10006", "LAB_10007"].includes(n.id)) {
        n.position = newCytoscapeNode10006Position;
      } else {
        n.position = newCytoscapeNode10005Position;
      }
    });

    eventHandlers["mouseup"]?.({
      position: newCytoscapeNode10006Position,
    });

    expect(updatedElements?.nodes).toHaveLength(9); // 2 marks, 4 mark labels, 3 line labels

    const node10006GroundPosition = cytoCoordMapper.cytoscapeToGroundCoord(newCytoscapeNode10006Position, 1);
    expect(updatedElements?.nodes?.[0]?.position).toEqual(node10006GroundPosition);
    expect(updatedElements?.nodes?.[0]?.properties?.ignorePositionChange).toBeFalsy();
    expect(updatedElements?.nodes?.[0]?.id).toBe("10006");
    expect(updatedElements?.nodes?.[0]?.label).toBeUndefined();
    expect(updatedElements?.nodes?.[0]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[0]?.properties?.pointOffset).toBe(0);

    const node10005GroundPosition = cytoCoordMapper.cytoscapeToGroundCoord(newCytoscapeNode10005Position, 1);
    expect(updatedElements?.nodes?.[1]?.position).toEqual(node10005GroundPosition);
    expect(updatedElements?.nodes?.[1]?.properties?.ignorePositionChange).toBeFalsy();
    expect(updatedElements?.nodes?.[1]?.id).toBe("10005");
    expect(updatedElements?.nodes?.[1]?.label).toBeUndefined();
    expect(updatedElements?.nodes?.[1]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[1]?.properties?.pointOffset).toBe(0);

    // Mark labels (including symbols) stay at the updated node position and retain any anchor and offset
    expect(updatedElements?.nodes?.[2]?.id).toBe("LAB_10006");
    expect(updatedElements?.nodes?.[2]?.label).toBe("Mark 10006");
    expect(updatedElements?.nodes?.[2]?.position).toEqual(node10006GroundPosition);
    expect(updatedElements?.nodes?.[2]?.properties?.ignorePositionChange).toBeFalsy();
    expect(updatedElements?.nodes?.[2]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[2]?.properties?.pointOffset).toBe(0);
    expect(updatedElements?.nodes?.[3]?.id).toBe("LAB_10007");
    expect(updatedElements?.nodes?.[3]?.label).toBe("96");
    expect(updatedElements?.nodes?.[3]?.position).toEqual(node10006GroundPosition);
    expect(updatedElements?.nodes?.[3]?.properties?.ignorePositionChange).toBeFalsy();
    expect(updatedElements?.nodes?.[3]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[3]?.properties?.pointOffset).toBe(0);

    expect(updatedElements?.nodes?.[4]?.id).toBe("LAB_10009");
    expect(updatedElements?.nodes?.[4]?.label).toBe("96");
    expect(updatedElements?.nodes?.[4]?.position).toEqual(node10005GroundPosition);
    expect(updatedElements?.nodes?.[4]?.properties?.ignorePositionChange).toBeFalsy();
    expect(updatedElements?.nodes?.[4]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[4]?.properties?.pointOffset).toBe(0);

    expect(updatedElements?.nodes?.[5]?.id).toBe("LAB_10008");
    expect(updatedElements?.nodes?.[5]?.label).toBe("Mark 10005");
    expect(updatedElements?.nodes?.[5]?.position).toEqual(node10005GroundPosition);
    expect(updatedElements?.nodes?.[5]?.properties?.ignorePositionChange).toBeFalsy();
    expect(updatedElements?.nodes?.[5]?.properties?.anchorAngle).toBe(0);
    expect(updatedElements?.nodes?.[5]?.properties?.pointOffset).toBe(0);

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
    expect(updatedElements?.nodes?.[6]?.properties?.ignorePositionChange).toBeFalsy();
    expect(updatedElements?.nodes?.[6]?.properties?.anchorAngle).toBeCloseTo(189.9, 1);
    expect(updatedElements?.nodes?.[6]?.properties?.pointOffset).toBeCloseTo(14, 1);
    expect(updatedElements?.nodes?.[6]?.properties?.textRotation).toBeCloseTo(99.9, 1);

    expect(updatedElements?.nodes?.[7]?.id).toBe("LAB_15");
    expect(updatedElements?.nodes?.[7]?.label).toBe("Line 1005");
    expect(updatedElements?.nodes?.[7]?.position?.x).toBeCloseTo(expectedGroundPosition1005.x, 1);
    expect(updatedElements?.nodes?.[7]?.position?.y).toBeCloseTo(expectedGroundPosition1005.y, 1);
    expect(updatedElements?.nodes?.[7]?.properties?.ignorePositionChange).toBeFalsy();
    expect(updatedElements?.nodes?.[7]?.properties?.anchorAngle).toBeCloseTo(180, 1);
    expect(updatedElements?.nodes?.[7]?.properties?.pointOffset).toBeCloseTo(14, 1);
    expect(updatedElements?.nodes?.[7]?.properties?.textRotation).toBeCloseTo(180, 1);

    expect(updatedElements?.nodes?.[8]?.id).toBe("LAB_16");
    expect(updatedElements?.nodes?.[8]?.label).toBe("Line 1004");
    expect(updatedElements?.nodes?.[8]?.position?.x).toBeCloseTo(expectedGroundPosition1004.x, 1);
    expect(updatedElements?.nodes?.[8]?.position?.y).toBeCloseTo(expectedGroundPosition1004.y, 1);
    expect(updatedElements?.nodes?.[8]?.properties?.ignorePositionChange).toBeFalsy();
    expect(updatedElements?.nodes?.[8]?.properties?.anchorAngle).toBeCloseTo(161.6, 1);
    expect(updatedElements?.nodes?.[8]?.properties?.pointOffset).toBeCloseTo(14, 1);
    expect(updatedElements?.nodes?.[8]?.properties?.textRotation).toBeCloseTo(161.6, 1);
  });
});
