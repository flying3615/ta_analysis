import { makeScaledSVG } from "@/modules/plan/makeScaledSVG";

const circleSVG =
  "WIDTH:%WIDTH%" +
  "HEIGHT:%HEIGHT%" +
  "VIEWPORT_WIDTH:%VIEWPORT_WIDTH%" +
  "VIEWPORT_HEIGHT:%VIEWPORT_HEIGHT%" +
  "ROTATION:%ROTATION%" +
  "CENTRE_X:%CENTRE_X%" +
  "CENTRE_Y:%CENTRE_Y%" +
  "RADIUS:%RADIUS%" +
  "LINE_COLOR:%LINE_COLOR%" +
  "FONT_FAMILY:%FONT_FAMILY%" +
  "FONT_SIZE:%FONT_SIZE%" +
  "LABEL:%LABEL%";

describe("makeScaledSvg", () => {
  test("Substitutes width and height", () => {
    const svg =
      '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg>' +
      '<svg width="%WIDTH%px" height="%HEIGHT%px" viewBox="0,0,8,8" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '    <circle cx="4" cy="4" r="3.8" />' +
      "</svg>";

    const scaledSvg = makeScaledSVG({ symbolSvg: svg, svg: { width: 10, height: 20 } });
    expect(decodeURIComponent(scaledSvg)).toBe(
      'data:image/svg+xml;utf8,<?xml version="1.0" encoding="UTF-8"?>' +
        '<!DOCTYPE svg><svg width="10px" height="20px" viewBox="0,0,8,8" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '    <circle cx="4" cy="4" r="3.8" /></svg>',
    );
  });

  test("CircleSVG using defaults", () => {
    const scaledSvg = makeScaledSVG({
      symbolSvg: circleSVG,
      svg: { width: 10, height: 20 },
    });
    expect(decodeURIComponent(scaledSvg)).toBe(
      "data:image/svg+xml;utf8," +
        "WIDTH:10" +
        "HEIGHT:20" +
        "VIEWPORT_WIDTH:0" +
        "VIEWPORT_HEIGHT:0" +
        "ROTATION:0" +
        "CENTRE_X:0" +
        "CENTRE_Y:0" +
        "RADIUS:1" +
        "LINE_COLOR:black" +
        "FONT_FAMILY:" +
        "FONT_SIZE:12" +
        "LABEL:",
    );
  });

  test("CircleSVG all (non scaling) params", () => {
    const scaledSvg = makeScaledSVG({
      symbolSvg: circleSVG,
      svg: { width: 10, height: 10 },
      viewport: { height: 12, width: 12 },
      centre: { x: 1, y: 2 },
      font: "test",
      fontSize: 24,
      label: "T",
      lineColor: "red",
      radius: 6,
      textRotation: 45,
    });
    expect(decodeURIComponent(scaledSvg)).toBe(
      "data:image/svg+xml;utf8," +
        "WIDTH:10" +
        "HEIGHT:10" +
        "VIEWPORT_WIDTH:12" +
        "VIEWPORT_HEIGHT:12" +
        "ROTATION:45" +
        "CENTRE_X:1" +
        "CENTRE_Y:2" +
        "RADIUS:6" +
        "LINE_COLOR:red" +
        "FONT_FAMILY:test" +
        "FONT_SIZE:24" +
        "LABEL:T",
    );
  });

  test("CircleSVG all params", () => {
    const scaledSvg = makeScaledSVG({
      symbolSvg: circleSVG,
      svg: { width: 10, height: 10 },
      viewport: { height: 12, width: 12 },
      centre: { x: 1, y: 2 },
      font: "test",
      fontSize: 24,
      label: "T",
      lineColor: "red",
      radius: 6,
      textRotation: 45,
      fontScaleFactor: 0.5,
      scaleFactor: 0.5,
    });
    expect(decodeURIComponent(scaledSvg)).toBe(
      "data:image/svg+xml;utf8," +
        "WIDTH:5" +
        "HEIGHT:5" +
        "VIEWPORT_WIDTH:6" +
        "VIEWPORT_HEIGHT:6" +
        "ROTATION:45" +
        "CENTRE_X:0.5" +
        "CENTRE_Y:1" +
        "RADIUS:3" +
        "LINE_COLOR:red" +
        "FONT_FAMILY:test" +
        "FONT_SIZE:12" +
        "LABEL:T",
    );
  });
});
