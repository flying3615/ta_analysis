export const makeScaledSVG = ({
  symbolSvg,
  svg,
  lineColor = "black",
  viewport = { width: 0, height: 0 },
  centre = { x: 0, y: 0 },
  radius = 1,
  font = "",
  fontSize = 12,
  textRotation = 0,
  label = "",
  scaleFactor = 1,
  fontScaleFactor = 1,
}: {
  symbolSvg: string;
  svg: { width: number; height: number };
  lineColor?: string;
  viewport?: { width: number; height: number };
  centre?: { x: number; y: number };
  radius?: number;
  font?: string;
  fontSize?: number;
  textRotation?: number;
  label?: string;
  scaleFactor?: number;
  fontScaleFactor?: number;
}) => {
  // symbolSvg contains the nominal image sizes and the SVG text
  // which is called by substituting the %WIDTH% and %HEIGHT% below
  const substSVG = symbolSvg
    .replaceAll("%WIDTH%", (svg.width * scaleFactor).toString())
    .replaceAll("%HEIGHT%", (svg.height * scaleFactor).toString())
    .replaceAll("%VIEWPORT_WIDTH%", (viewport.width * scaleFactor).toString())
    .replaceAll("%VIEWPORT_HEIGHT%", (viewport.height * scaleFactor).toString())
    .replaceAll("%CENTRE_X%", (centre.x * scaleFactor).toString())
    .replaceAll("%CENTRE_Y%", (centre.y * scaleFactor).toString())
    .replaceAll("%RADIUS%", (radius * scaleFactor).toString())
    .replaceAll("%LINE_COLOR%", lineColor.toString())
    .replaceAll("%ALIGNMENT_BASELINE%", "middle")
    .replaceAll("%FONT_FAMILY%", font)
    .replaceAll("%FONT_SIZE%", (fontSize * fontScaleFactor).toString())
    .replaceAll("%ROTATION%", textRotation.toString())
    .replaceAll("%LABEL%", label);

  return "data:image/svg+xml;utf8," + encodeURIComponent(substSVG);
};
