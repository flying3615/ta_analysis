export const makeScaledSVG = (
  symbolSvg: string,
  widthPixels: number,
  heightPixels: number,
  viewportWidth: number = 0,
  viewportHeight: number = 0,
  centreX: number = 0,
  centreY: number = 0,
  radius: number = 1,
) => {
  // symbolSvg contains the nominal image sizes and the SVG text
  // which is called by substituting the %WIDTH% and %HEIGHT% below
  const substSVG = symbolSvg
    .replaceAll("%WIDTH%", widthPixels.toString())
    .replaceAll("%HEIGHT%", heightPixels.toString())
    .replaceAll("%VIEWPORT_WIDTH%", viewportWidth.toString())
    .replaceAll("%VIEWPORT_HEIGHT%", viewportHeight.toString())
    .replaceAll("%CENTRE_X%", centreX.toString())
    .replaceAll("%CENTRE_Y%", centreY.toString())
    .replaceAll("%RADIUS%", radius.toString());

  return {
    svg: "data:image/svg+xml;utf8," + encodeURIComponent(substSVG),
    width: widthPixels,
    height: heightPixels,
  };
};
