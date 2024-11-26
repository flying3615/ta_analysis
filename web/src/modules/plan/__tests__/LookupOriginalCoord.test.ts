import cytoscape, { CollectionReturnValue, EdgeSingular, NodeSingular } from "cytoscape";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { transformMovedLabelCoordinates } from "@/modules/plan/LookupOriginalCoord";

describe("transformMovedLabelCoordinates", () => {
  it("transformMovedLabelCoordinates sets positionOffset and anchor angle of non symbol labels", () => {
    interface ExpectedDataReturn {
      id?: string;
      label?: string;
      pointOffset?: number;
      anchorAngle?: number;
      ignorePositionChange?: boolean;
    }

    const mockLabelPositionToOffsetAndAngle = (_: cytoscape.NodeSingular, startPosition: cytoscape.Position) => {
      return { pointOffset: startPosition.x * 2, anchorAngle: startPosition.y * 2 };
    };
    const mockCytoscapeCoordinateMapper = {
      labelPositionToOffsetAndAngle: mockLabelPositionToOffsetAndAngle,
    } as unknown as CytoscapeCoordinateMapper;
    const nodeId = "1";
    const elementDataSpy = jest.fn();

    let data = {
      id: nodeId,
      label: "test label",
    };
    elementDataSpy.mockImplementation((newData: Record<never, never> | undefined): ExpectedDataReturn => {
      if (!newData) {
        return data;
      }
      data = {
        ...data,
        ...newData,
      };
      return data;
    });
    const testElement: NodeSingular & EdgeSingular = {
      id(): string {
        return nodeId;
      },
      isNode(): boolean {
        return true;
      },
      data: elementDataSpy,
    } as unknown as NodeSingular & EdgeSingular;
    const x = 1;
    const y = 2;
    const initialPositions: Record<string, cytoscape.Position> = {
      [nodeId]: {
        x,
        y,
      },
    };
    const collectionReturnValue = [testElement] as unknown as CollectionReturnValue;

    const result = transformMovedLabelCoordinates(
      mockCytoscapeCoordinateMapper,
      collectionReturnValue,
      initialPositions,
    );
    const returnedData: ExpectedDataReturn = result[0]?.data() as ExpectedDataReturn;
    expect(returnedData.pointOffset).toEqual(x * 2);
    expect(returnedData.anchorAngle).toEqual(y * 2);
    expect(returnedData.ignorePositionChange).toBeUndefined();
  });
});
