import { cytoscapeUtils } from "@/util/cytoscapeUtil";

const { zoomByDelta, zoomToFit } = cytoscapeUtils;

describe("cytoscapeUtil", () => {
  const mockCy = {
    reset: jest.fn(),
    pan: jest.fn(),
    zoom: jest.fn().mockReturnValue(1.0),
    container: jest.fn().mockReturnValue({ clientWidth: 1600, clientHeight: 900 }),
  } as unknown as jest.Mocked<cytoscape.Core>;

  test("should call cy.reset() on Zoom to screen", () => {
    zoomToFit(mockCy);
    expect(mockCy.reset).toHaveBeenCalled();
  });

  test("should increase zoom on Zoom in", () => {
    zoomByDelta(1, mockCy);
    expect(mockCy.zoom).toHaveBeenCalledWith({
      level: 3.25,
      renderedPosition: { x: 800, y: 450 },
    });
  });

  test("should decrease zoom on Zoom out", () => {
    zoomByDelta(-1, mockCy);
    expect(mockCy.zoom).toHaveBeenCalledWith(0.75);
  });
});
