import { render } from "@testing-library/react";
import cytoscape from "cytoscape";

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

describe("styleNodeMethods", () => {
  const elementData = {
    font: "Tahoma",
    fontSize: 12,
    label: "Hello, world",
    textRotation: 120,
    textAlignment: "topLeft,textCenter",
    anchorAngle: 30,
    pointOffset: 10,
  } as Record<string, number | string>;
  const testEle = {
    data: (dataAttribute: string) => elementData[dataAttribute],
  } as cytoscape.NodeSingular;

  test(`textDimensions should measure single line text`, () => {
    renderDummyCanvas();
    const dimensions = textDimensions(testEle);
    expect(dimensions.width).toBe(12); // jest-mock is not very good at measure
  });

  test("textDiameter should return calculated diameter", () => {
    renderDummyCanvas();
    const diam = textDiameter(testEle);
    expect(diam).toBeCloseTo(25.0, 1);
  });

  test("circleLabel should return an SVG circle scaled around label", () => {
    renderDummyCanvas();
    const circle = circleLabel(testEle);
    // We don't get the actual SVG because of jest
    // this is covered in SB
    expect(circle).toBe("data:image/svg+xml;utf8,circle.svg");
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
    const margin = rotatedMargin(testEle);

    expect(margin.x).toBeCloseTo(8.5, 1);
    expect(margin.y).toBeCloseTo(-1.75, 2);
  });

  const renderDummyCanvas = () => render(<canvas data-id="layer2-node" />);
});
