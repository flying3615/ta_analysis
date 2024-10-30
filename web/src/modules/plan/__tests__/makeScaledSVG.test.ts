import { makeScaledSVG } from "@/modules/plan/makeScaledSVG";

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
});
