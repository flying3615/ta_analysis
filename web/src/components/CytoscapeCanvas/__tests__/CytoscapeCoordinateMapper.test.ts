import { IDiagram } from "@linz/survey-plan-generation-api-client";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";

describe("CytoscapeCoordinateMapper", () => {
  const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(
    { clientWidth: 390, clientHeight: 258 } as HTMLElement,
    [
      { id: 1, bottomRightPoint: { x: 30, y: -20 }, originPageOffset: { x: 0, y: 0 }, zoomScale: 100 } as IDiagram,
      { id: 2, bottomRightPoint: { x: 25, y: -24 }, originPageOffset: { x: 23, y: -22 }, zoomScale: 100 } as IDiagram,
    ],
  );

  test("groundCoordToCytoscape maps ground coordinates onto cytoscape pixels", () => {
    expect(cytoscapeCoordinateMapper.groundCoordToCytoscape({ x: 0, y: 0 }, 1).x).toBeCloseTo(3.5, 1);
    expect(cytoscapeCoordinateMapper.groundCoordToCytoscape({ x: 0, y: 0 }, 1).y).toBeCloseTo(3.5, 1);

    const corner = cytoscapeCoordinateMapper.groundCoordToCytoscape({ x: 30, y: -20 }, 1);
    expect(corner.x).toBeCloseTo(274.2, 1);
    expect(corner.y).toBeCloseTo(184.0, 1);

    expect(cytoscapeCoordinateMapper.groundCoordToCytoscape({ x: 150, y: -100 }, 1).x).toBeCloseTo(1357.1, 1);
    expect(cytoscapeCoordinateMapper.groundCoordToCytoscape({ x: 150, y: -100 }, 1).y).toBeCloseTo(905.9, 1);
  });

  test("cytoscapeToGroundCoord maps cytoscape pixels onto ground coordinates", () => {
    expect(cytoscapeCoordinateMapper.cytoscapeToGroundCoord({ x: 0, y: 5.5 }, 1)).toStrictEqual({
      x: 1.108,
      y: -1.718,
    });

    const corner = cytoscapeCoordinateMapper.cytoscapeToGroundCoord({ x: 370.5, y: 252.5 }, 1);
    expect(corner.x).toBeCloseTo(42.2, 1);
    expect(corner.y).toBeCloseTo(-29.1, 1);

    expect(
      cytoscapeCoordinateMapper.cytoscapeToGroundCoord(
        {
          x: 1852.5,
          y: 1240.5,
        },
        1,
      ),
    ).toStrictEqual({ x: 206.404, y: -138.582 });
  });

  test("planCoordToCytoscape maps plan cm to cytoscape pixels", () => {
    expect(cytoscapeCoordinateMapper.planCoordToCytoscape({ x: 10, y: 15 }).x).toBeCloseTo(80.2, 1);
    expect(cytoscapeCoordinateMapper.planCoordToCytoscape({ x: 10, y: 15 }).y).toBeCloseTo(-145.4, 1);
  });

  test("planCmToCytoscape scales plan cm into cytoscape pixels", () => {
    expect(cytoscapeCoordinateMapper.planCmToCytoscape(1.0)).toBeCloseTo(9.0, 1);
  });
});
