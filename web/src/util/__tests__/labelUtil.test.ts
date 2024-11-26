import { CSS_PIXELS_PER_CM } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { POINTS_PER_CM } from "@/util/cytoscapeUtil";
import { calculateLabelBoundingBox, measureTextFallback } from "@/util/labelUtil";

describe("calculateLabelBoundingBox", () => {
  const TEST_LABEL_WIDTH = 3;
  const TEST_LABEL_HEIGHT = 0.5;
  const TEST_POS_X = 10;
  const TEST_POS_Y = -20;

  test("Works for a default unrotated, unshifted, centred label", () => {
    const result = calculateLabelBoundingBox(
      { x: TEST_POS_X, y: TEST_POS_Y },
      { dx: TEST_LABEL_WIDTH, dy: TEST_LABEL_HEIGHT },
    );
    expect(result.originalShift).toEqual({ dx: 0, dy: 0 });
    expect(result.xL).toBe(8.5);
    expect(result.xR).toBe(11.5);
    expect(result.yT).toBe(-19.75);
    expect(result.yB).toBe(-20.25);
  });

  test("Works for a left aligned label", () => {
    const result = calculateLabelBoundingBox(
      { x: TEST_POS_X, y: TEST_POS_Y },
      { dx: TEST_LABEL_WIDTH, dy: TEST_LABEL_HEIGHT },
      "centerLeft",
    );
    expect(result.originalShift).toEqual({ dx: 0, dy: 0 });
    expect(result.xL).toBe(TEST_POS_X);
    expect(result.xR).toBe(13.0);
    expect(result.yT).toBe(-19.75);
    expect(result.yB).toBe(-20.25);
  });

  test("Works for a shifted label", () => {
    const result = calculateLabelBoundingBox(
      { x: TEST_POS_X, y: TEST_POS_Y },
      { dx: TEST_LABEL_WIDTH, dy: TEST_LABEL_HEIGHT },
      "centerCenter",
      45,
      28.2,
    );
    const sideLength = 20 / POINTS_PER_CM;
    expect(result.originalShift.dx).toBeCloseTo(sideLength);
    expect(result.originalShift.dy).toBeCloseTo(sideLength);
    expect(result.xL).toBeCloseTo(8.5 + sideLength);
    expect(result.xR).toBeCloseTo(11.5 + sideLength);
    expect(result.yT).toBeCloseTo(-19.75 + sideLength);
    expect(result.yB).toBeCloseTo(-20.25 + sideLength);
  });

  test("Works for a rotated label", () => {
    const result = calculateLabelBoundingBox(
      { x: TEST_POS_X, y: TEST_POS_Y },
      { dx: TEST_LABEL_WIDTH, dy: TEST_LABEL_HEIGHT },
      "centerCenter",
      0,
      0,
      45,
    );
    expect(result.originalShift).toEqual({ dx: 0, dy: 0 });
    expect(result.xL).toBeCloseTo(8.76);
    expect(result.xR).toBeCloseTo(11.24);
    expect(result.yT).toBeCloseTo(-18.76);
    expect(result.yB).toBeCloseTo(-21.24);
  });

  test("Works for a 90 degree rotated label", () => {
    const result = calculateLabelBoundingBox(
      { x: TEST_POS_X, y: TEST_POS_Y },
      { dx: TEST_LABEL_WIDTH, dy: TEST_LABEL_HEIGHT },
      "centerCenter",
      0,
      0,
      90,
    );
    expect(result.originalShift).toEqual({ dx: 0, dy: 0 });
    expect(result.xL).toBeCloseTo(9.75);
    expect(result.xR).toBeCloseTo(10.25);
    expect(result.yT).toBeCloseTo(-18.5);
    expect(result.yB).toBeCloseTo(-21.5);
  });

  test("Works for a 90 degree rotated, bottom aligned, offset label", () => {
    const CM_OFFSET = 5;
    const result = calculateLabelBoundingBox(
      { x: TEST_POS_X, y: TEST_POS_Y },
      { dx: TEST_LABEL_WIDTH, dy: TEST_LABEL_HEIGHT },
      "bottomCenter",
      180,
      CM_OFFSET * POINTS_PER_CM,
      90,
    );
    expect(result.originalShift.dx).toBeCloseTo(-CM_OFFSET);
    expect(result.originalShift.dy).toBeCloseTo(0);

    const centreX = TEST_POS_X - TEST_LABEL_HEIGHT / 2 - CM_OFFSET;
    const centreY = TEST_POS_Y;

    //   expect(result.xL).toBeCloseTo(9.75);
    //   expect(result.xR).toBeCloseTo(10.25);
    expect(result.xR - result.xL).toBeCloseTo(TEST_LABEL_HEIGHT);
    expect((result.xR + result.xL) / 2).toBeCloseTo(centreX);
    //   expect(result.yT).toBeCloseTo(-23.25);
    //   expect(result.yB).toBeCloseTo(-26.25);
    expect(result.yT - result.yB).toBeCloseTo(TEST_LABEL_WIDTH);
    expect((result.yT + result.yB) / 2).toBeCloseTo(centreY);
  });

  test("Works for a NW pointed label", () => {
    const result = calculateLabelBoundingBox({ x: 2.0, y: 0 }, { dx: 5, dy: 0.5 }, "bottomLeft", 0, 0, 135);
    expect(result.originalShift.dx).toBeCloseTo(0);
    expect(result.originalShift.dy).toBeCloseTo(0);

    const labelHypot = Math.sqrt(0.5 ** 2 + 5 ** 2);
    const labelTheta = Math.atan2(0.5, 5) * (180 / Math.PI);
    const x0 = 2.0;
    const y0 = 0;
    const x1 = 2.0 + 5.0 * Math.cos(135 * (Math.PI / 180));
    const y1 = 5.0 * Math.sin(135 * (Math.PI / 180));
    const x2 = 2.0 + labelHypot * Math.cos((135 + labelTheta) * (Math.PI / 180));
    const y2 = labelHypot * Math.sin((135 + labelTheta) * (Math.PI / 180));
    const x3 = 2.0 + 0.5 * Math.cos((135 + 90) * (Math.PI / 180));
    const y3 = 0.5 * Math.sin((135 + 90) * (Math.PI / 180));

    const expectedXMax = Math.max(x0, x1, x2, x3);
    const expectedXMin = Math.min(x0, x1, x2, x3);
    const expectedYMax = Math.max(y0, y1, y2, y3);
    const expectedYMin = Math.min(y0, y1, y2, y3);

    expect(result.xL).toBeCloseTo(expectedXMin);
    expect(result.xR).toBeCloseTo(expectedXMax);
    expect(result.yT).toBeCloseTo(expectedYMax);
    expect(result.yB).toBeCloseTo(expectedYMin);
  });

  test("Works for a rotated and shifted label", () => {
    const result = calculateLabelBoundingBox(
      { x: 2.0, y: 0 },
      { dx: 5, dy: 0.5 },
      "bottomLeft",
      135,
      5 * POINTS_PER_CM,
      135,
    );
    const offsetSideCm = 5 / Math.sqrt(2);
    expect(result.originalShift.dx).toBeCloseTo(-offsetSideCm);
    expect(result.originalShift.dy).toBeCloseTo(offsetSideCm);

    const labelHypot = Math.sqrt(0.5 ** 2 + 5 ** 2);
    const labelTheta = Math.atan2(0.5, 5) * (180 / Math.PI);
    const x0 = 2.0 - offsetSideCm;
    const y0 = offsetSideCm;
    const x1 = 2.0 + 5.0 * Math.cos(135 * (Math.PI / 180)) - offsetSideCm;
    const y1 = 5.0 * Math.sin(135 * (Math.PI / 180)) + offsetSideCm;
    const x2 = 2.0 + labelHypot * Math.cos((135 + labelTheta) * (Math.PI / 180)) - offsetSideCm;
    const y2 = labelHypot * Math.sin((135 + labelTheta) * (Math.PI / 180)) + offsetSideCm;
    const x3 = 2.0 + 0.5 * Math.cos((135 + 90) * (Math.PI / 180)) - offsetSideCm;
    const y3 = 0.5 * Math.sin((135 + 90) * (Math.PI / 180)) + offsetSideCm;

    const expectedXMax = Math.max(x0, x1, x2, x3);
    const expectedXMin = Math.min(x0, x1, x2, x3);
    const expectedYMax = Math.max(y0, y1, y2, y3);
    const expectedYMin = Math.min(y0, y1, y2, y3);

    expect(result.xL).toBeCloseTo(expectedXMin);
    expect(result.xR).toBeCloseTo(expectedXMax);
    expect(result.yT).toBeCloseTo(expectedYMax);
    expect(result.yB).toBeCloseTo(expectedYMin);
  });
});

describe("measureTextFallback", () => {
  test("works for a 2 line string", () => {
    const textDims = measureTextFallback(["Hello", "World"], 10);
    expect(textDims.dx).toBeCloseTo((5 * 10) / CSS_PIXELS_PER_CM);
    expect(textDims.dy).toBeCloseTo((2 * 10) / CSS_PIXELS_PER_CM);
  });
});
