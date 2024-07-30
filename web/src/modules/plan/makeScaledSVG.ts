export const makeScaledSVG = (
  symbolSvg: {
    svg: string;
  },
  widthPixels: number,
  heightPixels: number,
) => {
  // symbolSvg contains the nominal image sizes and the SVG text
  // which is called by substituting the %WIDTH% and %HEIGHT% below
  return {
    svg:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        symbolSvg!.svg.replace("%WIDTH%", widthPixels.toString()).replace("%HEIGHT%", heightPixels.toString()),
      ),
    width: widthPixels,
    height: heightPixels,
  };
};
