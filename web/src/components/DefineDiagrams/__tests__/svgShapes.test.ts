import { svgSquare, svgCross, svgCircle, svgTriangle } from "@/components/DefineDiagrams/svgShapes";

const iconSize = 25;

describe("svgShapes", () => {
  it("can generate square SVG", () => {
    expect(svgSquare(iconSize, 8, "black", "white").replace(/\s/g, "")).toEqual(
      `<rect
        x="8"
        y="8"
        width="8"
        height="8"
        style="fill: white; stroke: black; stroke-width: 1px"
      />`.replace(/\s/g, ""),
    );
  });

  it("can generate cross SVG", () => {
    expect(svgCross(iconSize, 6).replace(/\s/g, "")).toEqual(
      `<line
        x1="9"
        y1="9"
        x2="15"
        y2="15"
        style="fill: white; stroke: black; stroke-width: 1px"
      />
      <line
        x1="9"
        y1="15"
        x2="15"
        y2="9"
        style="fill: white; stroke: black; stroke-width: 1px"
      />`.replace(/\s/g, ""),
    );
  });

  it("can generate circle SVG", () => {
    expect(svgCircle(iconSize, 3, "black", "black").replace(/\s/g, "")).toEqual(
      `<circle
        cx="12"
        cy="12"
        r="3"
        style="fill: black; stroke: black; stroke-width: 1px"
      />`.replace(/\s/g, ""),
    );
  });

  it("can generate triangle SVG", () => {
    expect(svgTriangle(iconSize, 12, "black", "black").replace(/\s/g, "")).toEqual(
      `<polygon
        points="12,6 18,16.39 6,16.39"
        style="fill: black; stroke: black; stroke-width: 2px"
      />`.replace(/\s/g, ""),
    );
  });
});
