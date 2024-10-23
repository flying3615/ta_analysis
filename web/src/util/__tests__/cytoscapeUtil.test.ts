import { cytoscapeUtils } from "@/util/cytoscapeUtil";

const { zoomByDelta, zoomToFit, isPositionWithinAreaLimits } = cytoscapeUtils;

describe("cytoscapeUtil", () => {
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

  test("isPositionWithinAreaLimits returns correct value", () => {
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
