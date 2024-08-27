import { render, screen } from "@testing-library/react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import {
  calculateCircleSvgParams,
  circleLabel,
  rotatedMargin,
  textDiameter,
  textDimensions,
  textHAlign,
  textJustification,
  textRotationClockwiseFromH,
  textVAlign,
} from "@/components/CytoscapeCanvas/styleNodeMethods.ts";
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
    const dimensions = textDimensions(testEle);
    expect(dimensions.width).toBe(12); // jest-mock is not very good at measure
  });

  test("textDiameter should return calculated diameter", () => {
    renderDummyCanvas();
    const diam = textDiameter(testEle);
    expect(diam).toBeCloseTo(15.3, 1);
  });

  test("circleLabel should return an SVG circle scaled around label", () => {
    renderDummyCanvas();
    const cytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(screen.getByTestId("dummyCanvas"), []);
    const circle = circleLabel(testEle, cytoscapeCoordinateMapper);
    // We don't get the actual SVG because of jest
    // this is covered in SB
    expect(circle.svg).toBe("data:image/svg+xml;utf8,circle.svg");
    expect(circle.height).toBeCloseTo(0.27, 1);
    expect(circle.width).toBeCloseTo(2.3, 1);
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

    expect(margin.x).toBeCloseTo(1.1, 1);
    expect(margin.y).toBeCloseTo(0, 1);
  });

  describe(`calculateCircleSvgParams`, () => {
    test(`Centers circle on text for a default label`, () => {
      const cytoscapeCoordinateMapper = {
        fontScaleFactor: () => 1.2,
      } as unknown as CytoscapeCoordinateMapper;

      const ele = nodeSingular({
        ...defaultTestNode,
        textAlignment: "centerCenter",
        textRotation: 0,
        anchorAngle: 0,
        pointOffset: 0,
      });

      const params = calculateCircleSvgParams({ width: 40, height: 20 }, ele, cytoscapeCoordinateMapper, 42, {
        x: 0,
        y: 0,
      });

      expect(params.svgWidth).toBeCloseTo(55.2, 1);
      expect(params.svgHeight).toBeCloseTo(55.2, 1);
      expect(params.svgCentreX).toBeCloseTo(27.6, 1);
      expect(params.svgCentreY).toBeCloseTo(27.6, 1);
      expect(params.scaledSvgCircleRadius).toBeCloseTo(25.2, 1);
    });

    test(`Centers circle on anchor point when text align not centre`, () => {
      const cytoscapeCoordinateMapper = {
        fontScaleFactor: () => 1.2,
      } as unknown as CytoscapeCoordinateMapper;

      const ele = nodeSingular({
        ...defaultTestNode,
        textAlignment: "topLeft",
        textRotation: 0,
        anchorAngle: 0,
        pointOffset: 0,
      });

      const params = calculateCircleSvgParams({ width: 40, height: 20 }, ele, cytoscapeCoordinateMapper, 42, {
        x: 0,
        y: 0,
      });
      expect(params.svgWidth).toBeCloseTo(103.2, 1);
      expect(params.svgHeight).toBeCloseTo(79.2, 1);
      expect(params.svgCentreX).toBeCloseTo(75.6, 1);
      expect(params.svgCentreY).toBeCloseTo(51.6, 1);
      expect(params.scaledSvgCircleRadius).toBeCloseTo(25.2, 1);
    });

    test(`Applies offset at angle`, () => {
      const cytoscapeCoordinateMapper = {
        fontScaleFactor: () => 1.2,
      } as unknown as CytoscapeCoordinateMapper;

      const ele = nodeSingular({
        ...defaultTestNode,
        textAlignment: "centerCenter",
        textRotation: 0,
      });

      const params = calculateCircleSvgParams({ width: 40, height: 20 }, ele, cytoscapeCoordinateMapper, 42, {
        x: 10 * Math.cos((30 * 180) / Math.PI),
        y: 10 * Math.sin((30 * 180) / Math.PI),
      });

      expect(params.svgWidth).toBeCloseTo(73.4, 1);
      expect(params.svgHeight).toBeCloseTo(63.4, 1);
      expect(params.svgCentreX).toBeCloseTo(27.6, 1);
      expect(params.svgCentreY).toBeCloseTo(27.6, 1);
      expect(params.scaledSvgCircleRadius).toBeCloseTo(25.2, 1);
    });

    test(`Slants circle when text rotated`, () => {
      const cytoscapeCoordinateMapper = {
        fontScaleFactor: () => 1.2,
      } as unknown as CytoscapeCoordinateMapper;

      const ele = nodeSingular({
        ...defaultTestNode,
        textAlignment: "centerRight",
        textRotation: 30,
      });

      const params = calculateCircleSvgParams({ width: 40, height: 20 }, ele, cytoscapeCoordinateMapper, 42, {
        x: 0,
        y: 0,
      });
      expect(params.svgWidth).toBeCloseTo(96.8, 1);
      expect(params.svgHeight).toBeCloseTo(79.2, 1);
      expect(params.svgCentreX).toBeCloseTo(27.6, 1);
      expect(params.svgCentreY).toBeCloseTo(51.6, 1);
      expect(params.scaledSvgCircleRadius).toBeCloseTo(25.2, 1);
    });

    test(`Corrects for changes to window or browser zoom`, () => {
      const cytoscapeCoordinateMapper = {
        fontScaleFactor: () => 2.4,
      } as unknown as CytoscapeCoordinateMapper;

      const ele = nodeSingular({
        ...defaultTestNode,
        textAlignment: "topLeft",
        textRotation: 0,
        anchorAngle: 0,
        pointOffset: 0,
      });

      const params = calculateCircleSvgParams({ width: 40, height: 20 }, ele, cytoscapeCoordinateMapper, 42, {
        x: 0,
        y: 0,
      });

      expect(params.svgWidth).toBeCloseTo(206.4, 1);
      expect(params.svgHeight).toBeCloseTo(158.4, 1);
      expect(params.svgCentreX).toBeCloseTo(151.2, 1);
      expect(params.svgCentreY).toBeCloseTo(103.2, 1);
      expect(params.scaledSvgCircleRadius).toBeCloseTo(50.4, 1);
    });
  });

  const renderDummyCanvas = () => render(<canvas data-id="layer2-node" data-testid="dummyCanvas" />);
});
