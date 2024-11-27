import { LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import cytoscape from "cytoscape";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { cytoscapeUtils, keepNodeWithinAreaLimit } from "@/util/cytoscapeUtil";

const { zoomByDelta, zoomToFit, isPositionWithinAreaLimits } = cytoscapeUtils;

describe("cytoscapeUtil: Zoom", () => {
  const mockReset = jest.fn();
  const mockZoom = jest.fn().mockReturnValue(1.0);
  const mockCy = {
    reset: mockReset,
    pan: jest.fn(),
    zoom: mockZoom,
    container: jest.fn().mockReturnValue({ clientWidth: 1600, clientHeight: 900 }),
  } as unknown as jest.Mocked<cytoscape.Core>;

  test("should call cy.reset() on Zoom to screen", () => {
    zoomToFit(mockCy);
    expect(mockReset).toHaveBeenCalled();
  });

  test("should increase zoom on Zoom in", () => {
    zoomByDelta(1, mockCy);
    expect(mockZoom).toHaveBeenCalledWith({
      level: 3.25,
      renderedPosition: { x: 800, y: 450 },
    });
  });

  test("should decrease zoom on Zoom out", () => {
    zoomByDelta(-1, mockCy);
    expect(mockZoom).toHaveBeenCalledWith(0.75);
  });
});

describe("cytoscapeUtil: isPositionWithinAreaLimits", () => {
  test("it returns correct value", () => {
    expect(isPositionWithinAreaLimits({ x: 10, y: 10 }, [{ x1: 20, x2: 30, y1: 20, y2: 30 }])).toBeFalsy();
    expect(isPositionWithinAreaLimits({ x: 10, y: 10 }, [{ x1: 10, x2: 30, y1: 10, y2: 30 }])).toBeTruthy();
    expect(
      isPositionWithinAreaLimits({ x: 10, y: 10 }, [
        { x1: 20, x2: 30, y1: 20, y2: 30 },
        { x1: 10, x2: 30, y1: 10, y2: 30 },
      ]),
    ).toBeTruthy();
  });
});

describe("cytoscapeUtil: keepNodeWithinAreaLimit", () => {
  let currentPosition = { x: 100, y: 100 };
  const mockPosition = jest.fn().mockImplementation((pos: cytoscape.Position) => {
    if (pos) {
      currentPosition = pos;
    }
    return currentPosition;
  });
  const mockWidth = jest.fn().mockReturnValue(50);
  const mockHeight = jest.fn().mockReturnValue(50);
  const mockData = jest.fn().mockReturnValue({
    elementType: PlanElementType.LABELS,
    labelType: LabelDTOLabelTypeEnum.userAnnotation,
  });
  const mockBoundingBox = jest.fn().mockReturnValue({
    w: 50,
    h: 50,
  });
  const mockNode = {
    data: mockData,
    boundingBox: mockBoundingBox,
    position: mockPosition,
    width: mockWidth,
    height: mockHeight,
  } as unknown as cytoscape.NodeSingular;
  const mockGetElementById = jest.fn().mockImplementation((id) => ({
    position: () => (id === "border_1001" ? { x: 0, y: 0 } : { x: 1000, y: 1000 }),
  }));
  const mockCy = {
    getElementById: mockGetElementById,
  } as unknown as cytoscape.Core;
  const mockEvent = {
    cy: mockCy,
    target: mockNode,
  } as unknown as cytoscape.EventObject;

  test(`should not change position if within area limits for ${LabelDTOLabelTypeEnum.userAnnotation} label type`, () => {
    const initialPosition = mockNode.position();
    keepNodeWithinAreaLimit(mockEvent);
    expect(mockNode.position()).toEqual(initialPosition);
  });

  test(`should not change position if within area limits for ${LabelDTOLabelTypeEnum.markName} label type`, () => {
    mockData.mockReturnValueOnce({
      elementType: PlanElementType.COORDINATE_LABELS,
      labelType: LabelDTOLabelTypeEnum.markName,
    });
    const initialPosition = mockNode.position();
    keepNodeWithinAreaLimit(mockEvent);
    expect(mockNode.position()).toEqual(initialPosition);
  });

  test(`should constrain node position within area limits for ${LabelDTOLabelTypeEnum.markName} label type`, () => {
    mockData.mockReturnValueOnce({
      elementType: PlanElementType.COORDINATE_LABELS,
      labelType: LabelDTOLabelTypeEnum.markName,
    });
    currentPosition = { x: 1100, y: 1100 }; // Set initial position outside the border
    keepNodeWithinAreaLimit(mockEvent);
    expect(mockNode.position()).toEqual({ x: 950, y: 950 });
  });

  test(`should not change position if within area limits for ${PlanElementType.PARCEL_LABELS}`, () => {
    mockData.mockReturnValueOnce({
      elementType: PlanElementType.PARCEL_LABELS,
    });
    const initialPosition = mockNode.position();
    keepNodeWithinAreaLimit(mockEvent);
    expect(mockNode.position()).toEqual(initialPosition);
  });
});
