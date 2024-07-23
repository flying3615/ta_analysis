import { IDiagram } from "@linz/survey-plan-generation-api-client";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";

describe("CytoscapeCoordinateMapper", () => {
  const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(
    { clientWidth: 390, clientHeight: 258 } as HTMLElement,
    [
      { id: 1, bottomRightPoint: { x: 30, y: -20 }, originPageOffset: { x: 0, y: 0 } } as IDiagram,
      { id: 2, bottomRightPoint: { x: 25, y: -24 }, originPageOffset: { x: 23, y: -22 } } as IDiagram,
    ],
  );

  test("groundCoordToCytoscape maps ground coordinates onto cytoscape pixels", () => {
    expect(cytoscapeCoordinateMapper.groundCoordToCytoscape({ x: 0, y: 0 }, 1)).toStrictEqual({
      x: 0,
      y: 5.5,
    });

    const corner = cytoscapeCoordinateMapper.groundCoordToCytoscape({ x: 30, y: -20 }, 1);
    expect(corner.x).toBeCloseTo(370.5, 1);
    expect(corner.y).toBeCloseTo(252.5, 1);

    expect(cytoscapeCoordinateMapper.groundCoordToCytoscape({ x: 150, y: -100 }, 1)).toStrictEqual({
      x: 1852.5,
      y: 1240.5,
    });
  });
});
