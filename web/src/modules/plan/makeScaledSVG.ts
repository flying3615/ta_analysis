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
  labelColor = undefined,
  scaleFactor = 1,
  fontScaleFactor = 1,
  background = undefined,
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
  labelColor?: string;
  scaleFactor?: number;
  fontScaleFactor?: number;
  background?: {
    color: string;
    width: number;
    height: number;
  };
}) => {
  // symbolSvg contains the nominal image sizes and the SVG text
  // which is called by substituting the %WIDTH% and %HEIGHT% below

  const centerX = centre.x * scaleFactor;
  const centerY = centre.y * scaleFactor;

  const substSVG = symbolSvg
    .replaceAll("%WIDTH%", (svg.width * scaleFactor).toString())
    .replaceAll("%HEIGHT%", (svg.height * scaleFactor).toString())
    .replaceAll("%VIEWPORT_WIDTH%", (viewport.width * scaleFactor).toString())
    .replaceAll("%VIEWPORT_HEIGHT%", (viewport.height * scaleFactor).toString())
    .replaceAll("%CENTRE_X%", centerX.toString())
    .replaceAll("%CENTRE_Y%", (centre.y * scaleFactor).toString())
    .replaceAll("%RADIUS%", (radius * scaleFactor).toString())
    .replaceAll("%LINE_COLOR%", lineColor.toString())
    .replaceAll("%ALIGNMENT_BASELINE%", "middle")
    .replaceAll("%FONT_FAMILY%", font)
    .replaceAll("%FONT_SIZE%", (fontSize * fontScaleFactor).toString())
    .replaceAll("%ROTATION%", textRotation.toString())
    .replaceAll("%LABEL%", label)
    .replaceAll("%LABEL_COLOR%", labelColor || lineColor)
    .replaceAll("%BACKGROUND_X%", (background ? centerX - (background.width * scaleFactor) / 2 : "").toString())
    .replaceAll("%BACKGROUND_Y%", (background ? centerY - (background.height * scaleFactor) / 2 : "").toString())
    .replaceAll("%BACKGROUND_WIDTH%", (background ? background.width * scaleFactor : "").toString())
    .replaceAll("%BACKGROUND_HEIGHT%", (background ? background.height * scaleFactor : "").toString())
    .replaceAll("%BACKGROUND_COLOR%", background ? background.color : "")
    .replaceAll("%BACKGROUND_RADIUS%", (background ? background.height * scaleFactor * 0.1 : "").toString());

  return "data:image/svg+xml;utf8," + encodeURIComponent(substSVG);
};
