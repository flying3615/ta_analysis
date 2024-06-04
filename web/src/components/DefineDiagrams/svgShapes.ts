import { MapColors } from "./mapColors";

/**
 * Helpers to generate SVG strings for `square`, `cross` and `circle` shapes
 */

const centreOffset = (length: number) => Math.round((length - 2) / 2.0);

const makeStyle = (fillColor: string, strokeColor: string, strokeWidth = 1) =>
  `style="fill: ${fillColor}; stroke: ${strokeColor}; stroke-width: ${strokeWidth}px"`;

export const svgSquare = (
  boxSideLength = 25,
  sideLength = 16,
  strokeColor = MapColors.black,
  fillColor = MapColors.white,
) => {
  const startP = Math.round(centreOffset(boxSideLength) - sideLength / 2.0);

  return `
    <rect
      x="${startP}"
      y="${startP}"
      width="${sideLength}"
      height="${sideLength}"
      ${makeStyle(fillColor, strokeColor)}
    />`;
};

export const svgCross = (
  boxSideLength = 25,
  sideLength = 16,
  strokeColor = MapColors.black,
  fillColor = MapColors.white,
) => {
  const centre = centreOffset(boxSideLength);
  const startP = Math.round(centre - sideLength / 2.0);
  const endP = Math.round(centre + sideLength / 2.0);
  const styleTag = makeStyle(fillColor, strokeColor);

  return `
    <line
      x1="${startP}"
      y1="${startP}"
      x2="${endP}"
      y2="${endP}"
      ${styleTag}
    />
    <line
      x1="${startP}"
      y1="${endP}"
      x2="${endP}"
      y2="${startP}"
      ${styleTag}
    />
  `;
};

export const svgCircle = (
  boxSideLength = 25,
  radius: number,
  strokeColor = MapColors.black,
  fillColor = MapColors.white,
) => `
  <circle
    cx="${centreOffset(boxSideLength)}"
    cy="${centreOffset(boxSideLength)}"
    r="${radius}"
    ${makeStyle(fillColor, strokeColor)}
  />`;

export const svgTriangle = (
  boxSideLength = 25,
  sideLength: number,
  strokeColor = MapColors.black,
  fillColor = MapColors.white,
) => {
  const offset = centreOffset(boxSideLength) - sideLength / 2;
  const height = Math.round((sideLength * Math.sqrt(3) * 100) / 2) / 100;
  const points = [
    [offset + sideLength / 2, offset],
    [offset + sideLength, offset + height],
    [offset, offset + height],
  ];

  return `
    <polygon
      points="${points.map((p) => `${p[0]},${p[1]}`).join(" ")}"
      ${makeStyle(fillColor, strokeColor, 2)}
    />
  `;
};
