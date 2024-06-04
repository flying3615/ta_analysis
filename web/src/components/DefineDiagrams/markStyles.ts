import warningSvg from "@/assets/warning.svg?raw";

import FeatureLike from "ol/Feature";
import { Icon, Style } from "ol/style";
import { svgCircle, svgCross, svgSquare, svgTriangle } from "./svgShapes";
import { MapColors } from "./mapColors";

const iconSize = 25;

export const markStyleFunction = (feature: FeatureLike): Style[] => [
  new Style({
    image: new Icon({ src: svgForSymbol(feature.get("markSymbol")) }),
  }),
];

// we only want to generate one blob url for this icon
const warningIcon = warningTriangle();

/**
 * Generate the associated SVG based on mark type (determined by mark symbol code)
 */
function svgForSymbol(markSymbol: number): string {
  switch (markSymbol) {
    // Origin mark
    case 1:
      return warningIcon;
    // Non-witness origin
    case 2:
      return warningIcon;
    // Permanent reference mark (new)
    case 3:
      return newPRM();
    // Permanent reference mark (old)
    case 4:
      return oldPRM();
    // Witness mark (adopted or new)
    case 5:
      return warningIcon;
    // Witness mark (else)
    case 6:
      return warningIcon;
    // Post (adopted or new)
    case 7:
      return postAdoptedNewMark();
    // Post (other)
    case 8:
      return postOtherMark();
    // Unmarked (x symbol)
    case 9:
      return unmarkedPoint();
    case 10:
      // PEG (new)
      return circleSVG(MapColors.white);
    case 11:
      // PEG (other)
      return circleSVG(MapColors.black);
    case 12:
      // Adopted CSNM
      return adoptedCadastralSurveyNetworkMarkOrVCM();
    case 13:
      // Old or (invalid) New CSNM
      return oldCadastralSurveyNetworkMarkOrVCM();
    default:
      return circleSVG(MapColors.red);
  }
}

// PRM - New (PRMA or PRBD)
export const newPRM = (): string =>
  createSVG(
    `<circle fill="none" stroke="${MapColors.black}" cx="12" cy="12" r="9"/>` +
      `<circle fill="${MapColors.white}" stroke="${MapColors.black}" cx="12" cy="12" r="6"/>` +
      `<circle fill="${MapColors.white}" stroke="${MapColors.black}" cx="12" cy="12" r="3"/>`,
  );

// PRM - Old (PRMA or PRBD)
export const oldPRM = (): string =>
  createSVG(
    `<circle fill="none" stroke="${MapColors.black}" cx="12" cy="12" r="9"/>` +
      `<circle fill="none" stroke="${MapColors.black}" cx="12" cy="12" r="6"/>` +
      `<circle fill="${MapColors.black}" stroke="${MapColors.black}" cx="12" cy="12" r="3"/>`,
  );

// POST - adopted or new
export const postAdoptedNewMark = (): string => createSVG(svgSquare(iconSize, 8, MapColors.black, MapColors.white));

// POST - other
export const postOtherMark = (): string => createSVG(svgSquare(iconSize, 8, MapColors.black, MapColors.black));

// UNMARKED - draw a cross
export const unmarkedPoint = (): string => createSVG(svgCross(iconSize, 6));

// Circles for PEG & unknown symbol
export const circleSVG = (fill = MapColors.black): string => createSVG(svgCircle(iconSize, 3, MapColors.black, fill));

export const adoptedCadastralSurveyNetworkMarkOrVCM = (): string =>
  createSVG(svgTriangle(iconSize, 12, MapColors.black, MapColors.white));

export const oldCadastralSurveyNetworkMarkOrVCM = (): string =>
  createSVG(svgTriangle(iconSize, 12, MapColors.black, MapColors.black));

// this svg has an issue when using as inline data uri so we reference as a blob url
function warningTriangle(): string {
  return URL.createObjectURL(new Blob([warningSvg], { type: "image/svg+xml" }));
}

export const createSVG = (elements: string, width = 25, height = 25): string =>
  `data:image/svg+xml;utf8,
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${elements}
  </svg>`;
