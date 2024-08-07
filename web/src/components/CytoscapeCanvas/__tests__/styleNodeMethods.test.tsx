import { render, screen } from "@testing-library/react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import {
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
  const testEle = nodeSingular({
    font: "Tahoma",
    fontSize: 12,
    label: "Hello, world",
    textRotation: 120,
    textAlignment: "topLeft,textCenter",
    anchorAngle: 30,
    pointOffset: 10,
  });

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
    expect(circle.height).toBeCloseTo(19.4, 1);
    expect(circle.width).toBeCloseTo(33.4, 1);
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

  const renderDummyCanvas = () => render(<canvas data-id="layer2-node" data-testid="dummyCanvas" />);
});
