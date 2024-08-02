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
      x: 2.186842105263159,
      y: 1.935000000000001,
    });

    const corner = cytoscapeCoordinateMapper.groundCoordToCytoscape({ x: 30, y: -20 }, 1);
    expect(corner.x).toBeCloseTo(331.14, 1);
    expect(corner.y).toBeCloseTo(221.24, 1);

    expect(cytoscapeCoordinateMapper.groundCoordToCytoscape({ x: 150, y: -100 }, 1)).toStrictEqual({
      x: 1646.9368421052632,
      y: 1098.435,
    });
  });

  test("cytoscapeToGroundCoord maps cytoscape pixels onto ground coordinates", () => {
    expect(cytoscapeCoordinateMapper.cytoscapeToGroundCoord({ x: 0, y: 5.5 }, 1)).toStrictEqual({
      x: -0.199,
      y: -0.325,
    });

    const corner = cytoscapeCoordinateMapper.cytoscapeToGroundCoord({ x: 370.5, y: 252.5 }, 1);
    expect(corner.x).toBeCloseTo(33.6, 1);
    expect(corner.y).toBeCloseTo(-22.9, 1);

    expect(
      cytoscapeCoordinateMapper.cytoscapeToGroundCoord(
        {
          x: 1852.5,
          y: 1240.5,
        },
        1,
      ),
    ).toStrictEqual({ x: 168.747, y: -112.956 });
  });

  test("planCoordToCytoscape maps plan cm to cytoscape pixels", () => {
    expect(cytoscapeCoordinateMapper.planCoordToCytoscape({ x: 10, y: 15 })).toStrictEqual({
      x: 82.09372469635628,
      y: -131.24313765182185,
    });
  });

  test("planCmToCytoscape scales plan cm into cytoscape pixels", () => {
    expect(cytoscapeCoordinateMapper.planCmToCytoscape(1.0)).toBeCloseTo(8.88);
  });
});
