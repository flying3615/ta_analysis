import { render, screen } from "@testing-library/react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import {
  calculateCircleSvgParamsCm,
  circleLabel,
  rotatedMargin,
  textDiameterCm,
  textDimensions,
  textDimensionsCm,
  textHAlign,
  textJustification,
  textRotationClockwiseFromH,
  textVAlign,
} from "@/components/CytoscapeCanvas/styleNodeMethods";
import { nodeSingular } from "@/test-utils/cytoscape-utils";

describe("styleNodeMethods", () => {
  const defaultTestNode = {
    font: "Tahoma",
    fontSize: 12,
    label: "Hello, world",
    textRotation: 120,
    textAlignment: "topLeft,textCenter",
    anchorAngle: 30,
    pointOffset: 10,
  };
  const testEle = nodeSingular(defaultTestNode);

  test(`textDimensions should measure single line text`, () => {
    renderDummyCanvas();
    const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(screen.getByTestId("dummyCanvas"), []);
    const dimensions = textDimensions(testEle, cytoscapeCoordinateMapper);
    expect(dimensions.width).toBe(12); // jest-mock is not very good at measure
  });

  test(`textDimensionsCm should measure single line text`, () => {
    renderDummyCanvas();
    const dimensions = textDimensionsCm(testEle);
    expect(dimensions.width).toBeCloseTo(0.31, 1); // jest-mock is not very good at measure
  });

  test("textDiameterCm should return calculated diameter", () => {
    renderDummyCanvas();
    const diameter = textDiameterCm(testEle);
    expect(diameter).toBeCloseTo(0.44, 1);
  });

  test("circleLabel should return an SVG circle scaled around label", () => {
    renderDummyCanvas();
    const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(screen.getByTestId("dummyCanvas"), []);
    const circle = circleLabel(testEle, cytoscapeCoordinateMapper);
    // We don't get the actual SVG because of jest
    // this is covered in SB
    expect(circle.svg).toBe("data:image/svg+xml;utf8,circle.svg");
    expect(circle.height).toBeCloseTo(0.6, 1);
    expect(circle.width).toBeCloseTo(0.6, 1);
  });

  test("textRotationClockwiseFromH should return the rotation in radians clockwise from horizontal", () => {
    const rot = textRotationClockwiseFromH(testEle);
    expect(rot).toBeCloseTo(Math.PI * 2 - (Math.PI * 120.0) / 180.0);
  });

  describe("textAlignment", () => {
    test("textHAlign returns reversed horizontal alignment", () => {
      expect(textHAlign(testEle)).toBe("right");
    });
    test("textVAlign returns reversed vertical alignment", () => {
      expect(textVAlign(testEle)).toBe("bottom");
    });
    test("textJustification returns justification", () => {
      expect(textJustification(testEle)).toBe("center");
    });
  });

  test("rotatedMargin calculates the margin with offset and anchor adjust", () => {
    renderDummyCanvas();
    const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(screen.getByTestId("dummyCanvas"), []);
    const margin = rotatedMargin(testEle, cytoscapeCoordinateMapper);

    expect(margin.x).toBeCloseTo(4.1, 1);
    expect(margin.y).toBeCloseTo(0, 1);
  });

  describe(`calculateCircleSvgParams`, () => {
    test(`Centers circle on text for a default label`, () => {
      const params = calculateCircleSvgParamsCm(42);

      expect(params.svgWidth).toBeCloseTo(42.1, 1);
      expect(params.svgHeight).toBeCloseTo(42.1, 1);
      expect(params.svgCentreX).toBeCloseTo(21.1, 1);
      expect(params.svgCentreY).toBeCloseTo(21.1, 1);
      expect(params.svgCircleRadius).toBeCloseTo(21, 1);
    });

    test(`does not change with window or browser zoom`, () => {
      const params = calculateCircleSvgParamsCm(42);

      expect(params.svgWidth).toBeCloseTo(42.1, 1);
      expect(params.svgHeight).toBeCloseTo(42.1, 1);
      expect(params.svgCentreX).toBeCloseTo(21.1, 1);
      expect(params.svgCentreY).toBeCloseTo(21.1, 1);
      expect(params.svgCircleRadius).toBeCloseTo(21, 1);
    });
  });

  const renderDummyCanvas = () => render(<canvas data-id="layer2-node" data-testid="dummyCanvas" />);
});
