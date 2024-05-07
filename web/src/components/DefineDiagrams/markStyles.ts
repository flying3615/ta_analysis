import FeatureLike from "ol/Feature";
import { Icon, Style } from "ol/style";
import { svgCircle, svgCross, svgSquare, svgTriangle } from "./svgShapes";

const iconSize = 25;

export const markStyleFunction = (feature: FeatureLike): Style[] => [
  new Style({
    image: new Icon({ src: svgForSymbol(feature.get("markSymbol")) }),
  }),
];

/**
 * Generate the associated SVG based on mark type (determined by mark symbol code)
 */
function svgForSymbol(markSymbol: number): string {
  switch (markSymbol) {
    // Origin mark
    case 1:
      return originMark();
    // Non-witness origin
    case 2:
      return nonWitnessOriginMark();
    // Permanent reference mark (new)
    case 3:
      return newPRM();
    // Permanent reference mark (old)
    case 4:
      return oldPRM();
    // Witness mark (adopted or new)
    case 5:
      return newWitnessMark();
    // Witness mark (else)
    case 6:
      return oldWitnessMark();
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
      // PEG/NEW
      return circleSVG("white");
    case 11:
      // PEG / other
      return circleSVG("black");
    case 12:
      // Adopted CSNM
      return adoptedCadastralSurveyNetworkMarkOrVCM();
    case 13:
      // Old or (invalid) New CSNM
      return oldCadastralSurveyNetworkMarkOrVCM();
    default:
      return circleSVG("red");
  }
}

// Origin mark - 'ORWB' or 'ORWI'
export const originMark = (): string =>
  createSVG(
    '<line x1="0" y1="0" x2="14" y2="14" style="stroke:rgb(0,0,0);stroke-width:2" />' +
      '<line x1="0" y1="14" x2="14" y2="0" style="stroke:rgb(0,0,0);stroke-width:2" />' +
      '<circle fill="white" stroke="black" cx="7" cy="7" r="7"/>' +
      '<circle fill="black" stroke="black" cx="7" cy="7" r="3"/>',
  );

// Non-witness origin - 'ORBD' or 'ORIG'
export const nonWitnessOriginMark = (): string =>
  createSVG(
    '<line x1="0" y1="0" x2="14" y2="14" style="stroke:rgb(0,0,0);stroke-width:2" />' +
      '<line x1="0" y1="14" x2="14" y2="0" style="stroke:rgb(0,0,0);stroke-width:2" />' +
      '<circle fill="black" stroke="black" cx="7" cy="7" r="3"/>',
  );

// PRM - New (PRMA or PRBD)
export const newPRM = (): string =>
  createSVG(
    '<circle fill="none" stroke="black" cx="12" cy="12" r="9"/>' +
      '<circle fill="white" stroke="black" cx="12" cy="12" r="6"/>' +
      '<circle fill="white" stroke="black" cx="12" cy="12" r="3"/>',
  );

// PRM - Old (PRMA or PRBD)
export const oldPRM = (): string =>
  createSVG(
    '<circle fill="none" stroke="black" cx="12" cy="12" r="9"/>' +
      '<circle fill="none" stroke="black" cx="12" cy="12" r="6"/>' +
      '<circle fill="black" stroke="black" cx="12" cy="12" r="3"/>',
  );

// WITN - New
export const newWitnessMark = (): string =>
  createSVG(
    '<circle fill="none" stroke="black" cx="10" cy="10" r="7"/>' +
      '<circle fill="white" stroke="black" cx="10" cy="10" r="3"/>',
  );

// WITN - Old
export const oldWitnessMark = (): string =>
  createSVG(
    '<circle fill="none" stroke="black" cx="10" cy="10" r="7"/>' +
      '<circle fill="black" stroke="black" cx="10" cy="10" r="3"/>',
  );

// POST - adopted or new
export const postAdoptedNewMark = (): string => createSVG(svgSquare(iconSize, 8, "black", "white"));

// POST - other
export const postOtherMark = (): string => createSVG(svgSquare(iconSize, 8, "black", "black"));

// UNMARKED - draw a cross
export const unmarkedPoint = (): string => createSVG(svgCross(iconSize, 6));

// Circles for PEG & unknown symbol
export const circleSVG = (fill = "black"): string => createSVG(svgCircle(iconSize, 3, "black", fill));

export const adoptedCadastralSurveyNetworkMarkOrVCM = (): string =>
  createSVG(svgTriangle(iconSize, 12, "black", "white"));

export const oldCadastralSurveyNetworkMarkOrVCM = (): string => createSVG(svgTriangle(iconSize, 12, "black", "black"));

export const createSVG = (elements: string): string =>
  `data:image/svg+xml;utf8,
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${elements}
  </svg>`;
