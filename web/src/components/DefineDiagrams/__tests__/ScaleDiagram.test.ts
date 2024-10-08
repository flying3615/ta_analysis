import { DiagramsResponseDTO } from "@linz/survey-plan-generation-api-client";

import ScaleDiagram from "@/components/DefineDiagrams/ScaleDiagram.ts";
import { sizeDegreesToMetresAtLat } from "@/util/mapUtil.ts";

const PAGE_WIDTH_METRES = 0.0001 + 0.39;
const PAGE_HEIGHT_METRES = 0.0001 + (28.2 - 1.5) / 100.0;

describe("ScaleDiagram", () => {
  const diagrams = {
    diagrams: [
      {
        id: 1,
        diagramType: "SYST",
        shape: {
          type: "Polygon",
          coordinates: [
            [
              [10.0, -45.0],
              [10.001, -45.0],
              [10.001, -45.001],
              [10.0, -45.001],
              [10.0, -45.0],
            ],
          ],
        },
      },
      {
        id: 2,
        diagramType: "SYSP",
        shape: {
          type: "Polygon",
          coordinates: [
            [
              [10.0, -45.0],
              [10.002, -45.0],
              [10.002, -45.002],
              [10.0, -45.002],
              [10.0, -45.0],
            ],
          ],
        },
      },
    ],
  } as DiagramsResponseDTO;

  const calcScaledDimensions = (zoomScale: number, sizeDegrees: [number, number], lat: number) => {
    const sizeMetres = sizeDegreesToMetresAtLat(sizeDegrees, lat);
    return sizeMetres.map((d) => d / zoomScale);
  };

  const scaleDiagram = new ScaleDiagram(diagrams);

  it("should calculate zoomScale for a diagram smaller than the system generated diagrams", () => {
    const latLongCartesians = [
      { x: 10.0004, y: -45.0005 },
      { x: 10.0005, y: -45.0005 },
      { x: 10.0005, y: -45.0006 },
      { x: 10.0004, y: -45.0006 },
      { x: 10.0004, y: -45.0005 },
    ];
    expect(scaleDiagram.zoomScale(latLongCartesians)).toBeCloseTo(570.9, 0);
  });

  it("should calculate zoomScale for a diagram wider than the system generated diagrams", () => {
    const latLongCartesians = [
      { x: 10.0, y: -45.0005 },
      { x: 10.004, y: -45.0005 },
      { x: 10.004, y: -45.0006 },
      { x: 10.0, y: -45.0006 },
      { x: 10.0, y: -45.0005 },
    ];

    const zoomScale = scaleDiagram.zoomScale(latLongCartesians);
    expect(zoomScale).toBeCloseTo(1141.7, 0);
    const dimensions = calcScaledDimensions(zoomScale, [0.004, 0.0001], -45.0005);
    expect(dimensions[0]).toBeLessThanOrEqual(PAGE_WIDTH_METRES);
    expect(dimensions[1]).toBeLessThanOrEqual(PAGE_HEIGHT_METRES);
  });

  it("should calculate zoomScale for a diagram taller than the system generated diagrams", () => {
    const latLongCartesians = [
      { x: 10.0004, y: -45.0 },
      { x: 10.0005, y: -45.0 },
      { x: 10.0005, y: -45.003 },
      { x: 10.0004, y: -45.003 },
      { x: 10.0004, y: -45.0 },
    ];

    const zoomScale = scaleDiagram.zoomScale(latLongCartesians);
    expect(zoomScale).toBeCloseTo(1768.8, 0);
    const dimensions = calcScaledDimensions(zoomScale, [0.0001, 0.003], -45.0015);
    expect(dimensions[0]).toBeLessThanOrEqual(PAGE_WIDTH_METRES);
    expect(dimensions[1]).toBeLessThanOrEqual(PAGE_HEIGHT_METRES);
  });

  it("should calculate zoomScale for a diagram larger than the system generated diagrams using width when appropriate", () => {
    const latLongCartesians = [
      { x: 10.0, y: -45.0 },
      { x: 10.01, y: -45.0 },
      { x: 10.01, y: -45.003 },
      { x: 10.0, y: -45.003 },
      { x: 10.0, y: -45.0 },
    ];

    const zoomScale = scaleDiagram.zoomScale(latLongCartesians);
    expect(zoomScale).toBeCloseTo(2854.3, 0);
    const dimensions = calcScaledDimensions(zoomScale, [0.01, 0.003], -45.0015);
    expect(dimensions[0]).toBeLessThanOrEqual(PAGE_WIDTH_METRES);
    expect(dimensions[1]).toBeLessThanOrEqual(PAGE_HEIGHT_METRES);
  });

  it("should calculate zoomScale for a diagram larger than the system generated diagrams using height when appropriate", () => {
    const latLongCartesians = [
      { x: 10.0, y: -44.99 },
      { x: 10.004, y: -44.99 },
      { x: 10.004, y: -45.01 },
      { x: 10.0, y: -45.01 },
      { x: 10.0, y: -44.99 },
    ];

    const zoomScale = scaleDiagram.zoomScale(latLongCartesians);
    expect(zoomScale).toBeCloseTo(11788.4, 0);
    const dimensions = calcScaledDimensions(zoomScale, [0.004, 0.02], -45.0015);
    expect(dimensions[0]).toBeLessThanOrEqual(PAGE_WIDTH_METRES);
    expect(dimensions[1]).toBeLessThanOrEqual(PAGE_HEIGHT_METRES);
  });

  it("should calculate zoomScale from new diagram when there are no sysgen diagrams", () => {
    const scaleDiagramNoDiagrams = new ScaleDiagram({ diagrams: [] });

    const latLongCartesians = [
      { x: 10.0004, y: -45.0005 },
      { x: 10.0005, y: -45.0005 },
      { x: 10.0005, y: -45.0006 },
      { x: 10.0004, y: -45.0006 },
      { x: 10.0004, y: -45.0005 },
    ];
    const zoomScale = scaleDiagramNoDiagrams.zoomScale(latLongCartesians);
    expect(zoomScale).toBeCloseTo(59.0, 0);
    const dimensions = calcScaledDimensions(zoomScale, [0.0001, 0.0001], -45.0006);
    expect(dimensions[0]).toBeLessThanOrEqual(PAGE_WIDTH_METRES);
    expect(dimensions[1]).toBeLessThanOrEqual(PAGE_HEIGHT_METRES);
  });
});
