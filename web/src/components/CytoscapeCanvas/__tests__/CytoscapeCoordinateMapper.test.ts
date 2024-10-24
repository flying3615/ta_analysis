import { DiagramDTO } from "@linz/survey-plan-generation-api-client";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";

describe("CytoscapeCoordinateMapper", () => {
  const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(
    { clientWidth: 390, clientHeight: 258 } as HTMLElement,
    [
      { id: 1, bottomRightPoint: { x: 30, y: -20 }, originPageOffset: { x: 0, y: 0 }, zoomScale: 100 } as DiagramDTO,
      { id: 2, bottomRightPoint: { x: 25, y: -24 }, originPageOffset: { x: 23, y: -22 }, zoomScale: 100 } as DiagramDTO,
    ],
  );

  test("groundCoordToCytoscape maps ground coordinates onto cytoscape pixels", () => {
    const origin = cytoscapeCoordinateMapper.groundCoordToCytoscape({ x: 0, y: 0 }, 1);
    const bottomRight = cytoscapeCoordinateMapper.groundCoordToCytoscape({ x: 150, y: -100 }, 1);
    const topLeft = cytoscapeCoordinateMapper.groundCoordToCytoscape({ x: 30, y: -20 }, 1);

    expect(origin.x).toBeCloseTo(-10, 1);
    expect(origin.y).toBeCloseTo(-10, 1);

    expect(topLeft.x).toBeCloseTo(260.7, 1);
    expect(topLeft.y).toBeCloseTo(170.5, 1);

    expect(bottomRight.x).toBeCloseTo(1343.5, 1);
    expect(bottomRight.y).toBeCloseTo(892.4, 1);
  });

  test("cytoscapeToGroundCoord maps cytoscape pixels onto ground coordinates for diagram label", () => {
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

  test("groundCoordToCytoscape and cytoscapeToGroundCoord are consistent", () => {
    const origin = cytoscapeCoordinateMapper.groundCoordToCytoscape({ x: 0, y: 0 }, 1);
    const bottomRight = cytoscapeCoordinateMapper.groundCoordToCytoscape({ x: 150, y: -100 }, 1);

    const originGround = cytoscapeCoordinateMapper.cytoscapeToGroundCoord(origin, 1);
    const bottomRightGround = cytoscapeCoordinateMapper.cytoscapeToGroundCoord(bottomRight, 1);

    expect(originGround.x).toBeCloseTo(0, 4);
    expect(bottomRightGround.x).toBeCloseTo(150, 4);
    expect(bottomRightGround.y).toBeCloseTo(-100, 4);
  });

  test("planCoordToCytoscape maps plan cm to cytoscape pixels", () => {
    expect(cytoscapeCoordinateMapper.planCoordToCytoscape({ x: 10, y: 15 }).x).toBeCloseTo(80.2, 1);
    expect(cytoscapeCoordinateMapper.planCoordToCytoscape({ x: 10, y: 15 }).y).toBeCloseTo(-145.4, 1);
  });

  test("pageLabelCoordToCytoscape maps page label metres to cytoscape pixels", () => {
    expect(cytoscapeCoordinateMapper.pageLabelCoordToCytoscape({ x: 0.1, y: 0.15 }).x).toBeCloseTo(80.24, 1);
    expect(cytoscapeCoordinateMapper.pageLabelCoordToCytoscape({ x: 0.1, y: 0.15 }).y).toBeCloseTo(-145.35, 1);
  });

  test("planCmToCytoscape scales plan cm into cytoscape pixels", () => {
    expect(cytoscapeCoordinateMapper.planCmToCytoscape(1.0)).toBeCloseTo(9.0, 1);
  });

  test("getDiagramOuterLimitsPx returns the diagram outer limits in pixels", () => {
    const outerLimits = cytoscapeCoordinateMapper.getDiagramOuterLimitsPx();
    expect(outerLimits.x1).toBeCloseTo(3.535, 2);
    expect(outerLimits.x2).toBeCloseTo(355.454, 2);
    expect(outerLimits.y1).toBeCloseTo(3.535, 2);
    expect(outerLimits.y2).toBeCloseTo(226.417, 2);
  });

  test("diagramLabelPositionToOffsetAndAngle calculates correct offset and angle", () => {
    const mockMovedLabel = {
      position: () => ({ x: 100, y: 200 }),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      data: (key: string) => {
        if (key === "anchorAngle") return 60.8;
        if (key === "pointOffset") return 73.1;
      },
    } as unknown as cytoscape.NodeSingular;

    const result = cytoscapeCoordinateMapper.diagramLabelPositionToOffsetAndAngle(mockMovedLabel, {
      x: 50,
      y: 100,
    });

    expect(result.pointOffset).toBeCloseTo(315.9265, 2);
    expect(result.anchorAngle).toBeCloseTo(307.5933, 2);
  });

  test("pageLabelPositionsToOffsetAndAngle calculates correct offset and angle", () => {
    const mockNode = {
      position: () => ({ x: 100, y: 200 }),
    } as unknown as cytoscape.NodeSingular;

    const result = cytoscapeCoordinateMapper.pageLabelPositionsToOffsetAndAngle(mockNode);

    expect(result.pointOffset).toBeCloseTo(0.2478, 2);
    expect(result.anchorAngle).toBeCloseTo(63.434, 2);
  });
});
