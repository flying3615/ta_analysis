import cytoscape from "cytoscape";
import { max, sum } from "lodash-es";

import CircleSVG from "@/assets/symbols/circle.svg?raw";
import { CSS_PIXELS_PER_CM, CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { cytoscapeToDisplayFont } from "@/components/CytoscapeCanvas/fontDisplayFunctions";
import { symbolSvgs } from "@/components/CytoscapeCanvas/symbolSvgs";
import { memoizedTextAlign, TextAlignment } from "@/components/CytoscapeCanvas/textAlignment";
import { makeScaledSVG } from "@/modules/plan/makeScaledSVG";
import { FOREGROUND_COLOUR, FOREGROUND_COLOUR_BLACK } from "@/modules/plan/styling";
import { PIXELS_PER_POINT, POINTS_PER_CM } from "@/util/cytoscapeUtil";
import { measureTextFallback } from "@/util/labelUtil";
import { Delta } from "@/util/positionUtil";

export const LABEL_PADDING_PX = 1;

export interface StyleData {
  anchorAngle?: number;
  font?: string;
  fontSize?: number;
  fontStyle?: string;
  label?: string;
  pointOffset?: number;
  symbolId?: string;
  textAlignment?: string;
  textRotation?: number;
}

export const getStyleData = (ele: cytoscape.NodeSingular): StyleData => {
  const data = ele.data() as StyleData;
  return {
    ...data,
    font: cytoscapeToDisplayFont(ele),
  };
};

export const textDimensionsCm = (ele: cytoscape.NodeSingular): Delta => {
  const { font, fontSize, label } = getStyleData(ele);
  if (!font || !fontSize || !label) {
    return { dy: 0, dx: 0 };
  }

  const lines = label.split("\n");
  // Use the presumed cytoscape canvas to measure
  // text size in context
  const cyCanvas = document.querySelector('canvas[data-id="layer2-node"]') as HTMLCanvasElement;
  const cyContext = cyCanvas?.getContext("2d");

  if (cyContext) {
    cyContext.font = `${fontSize}px ${font}`; // order matters here
    const lineSizes = lines.map((l: string) => cyContext.measureText(l));

    const width = max<number>(lineSizes.map((ls: TextMetrics) => ls.width)) ?? 0;
    const height = sum(lineSizes.map((ls: TextMetrics) => ls.fontBoundingBoxAscent + ls.fontBoundingBoxDescent));

    return { dy: height / CSS_PIXELS_PER_CM, dx: width / CSS_PIXELS_PER_CM };
  }

  return measureTextFallback(lines, fontSize);
};

export const textDimensions = (ele: cytoscape.NodeSingular, cytoscapeCoordinateMapper: CytoscapeCoordinateMapper) => {
  const { font, fontSize, label } = getStyleData(ele);
  if (!font || !fontSize || !label) {
    return { height: 0, width: 0 };
  }

  const lines = label.split("\n");
  const scaledFontSize = fontSize * cytoscapeCoordinateMapper.fontScaleFactor();

  // Use the presumed cytoscape canvas to measure
  // text size in context
  const cyCanvas = document.querySelector('canvas[data-id="layer2-node"]') as HTMLCanvasElement;
  const cyContext = cyCanvas?.getContext("2d");

  if (cyContext) {
    cyContext.font = `${scaledFontSize}px ${font}`; // order matters here
    const lineSizes = lines.map((l: string) => cyContext.measureText(l));

    const width = max<number>(lineSizes.map((ls: TextMetrics) => ls.width)) ?? 0;
    const height = sum(lineSizes.map((ls: TextMetrics) => ls.fontBoundingBoxAscent + ls.fontBoundingBoxDescent));
    return { height, width };
  }

  // Fallback if we couldn't get the canvas context
  const height = lines.length * scaledFontSize;
  const width = (max(lines.map((l: string) => l.length)) ?? 0) * scaledFontSize;
  return { height, width };
};

export const textDiameterCm = (ele: cytoscape.NodeSingular) => {
  const { dx, dy } = textDimensionsCm(ele);
  const longestSide = max([dy, dx]) ?? 0;

  return Math.sqrt(2) * longestSide;
};

export const textRotationClockwiseFromH = (ele: cytoscape.NodeSingular) => {
  const clockwiseDegrees = 360 - (ele.data("textRotation") ?? 0);
  const resDegrees = clockwiseDegrees >= 360 ? clockwiseDegrees - 360 : clockwiseDegrees;

  return (resDegrees * Math.PI) / 180;
};

export const textRotationMathRads = (ele: cytoscape.NodeSingular) => {
  return ((ele.data("textRotation") ?? 0.0) * Math.PI) / 180;
};

export const fontStyle = (ele: cytoscape.NodeSingular): string =>
  ["boldItalic", "italic"].includes(getStyleData(ele).fontStyle ?? "") ? "italic" : "normal";
export const fontWeight = (ele: cytoscape.NodeSingular): string =>
  ["boldItalic", "bold"].includes(getStyleData(ele).fontStyle ?? "") ? "bold" : "normal";

export const textJustification = (ele: cytoscape.NodeSingular): TextAlignment["justify"] =>
  memoizedTextAlign(getStyleData(ele).textAlignment)?.justify ?? "left";

/**
 * Calculate the margin to apply,
 * This comprises the `pointOffset`, scaled and rotated
 * and the padding required around each label as per legacy
 *
 * @param ele
 * @param cytoscapeCoordinateMapper
 */
export const rotatedMargin = (ele: cytoscape.NodeSingular, cytoscapeCoordinateMapper: CytoscapeCoordinateMapper) => {
  const { anchorAngle = 0, pointOffset = 0 } = ele.data() as StyleData;
  const angleRadsAntiClockwise = ((360.0 - anchorAngle) * Math.PI) / 180.0;

  const cytoscapePixelOffset = cytoscapeCoordinateMapper.planCmToCytoscape(pointOffset / POINTS_PER_CM);
  return {
    x: cytoscapePixelOffset * Math.cos(angleRadsAntiClockwise),
    y: cytoscapePixelOffset * Math.sin(angleRadsAntiClockwise),
  };
};

/**
 *   Calculate the angle `textThetaRads` and the offset `textRadiusDist` in measured pixels from the centre of the text label
 *   to the anchor point
 *
 * @param textSize the measured size of the text label
 * @param ele the element we are measuring
 */
export const calculateTextAlignmentPolar = (
  textSize: { width: number; height: number },
  ele: cytoscape.NodeSingular,
) => {
  const textSlope = Math.sqrt((textSize.height * textSize.height) / 4 + (textSize.width * textSize.width) / 4);
  const textAngle = (Math.atan2(textSize.height, textSize.width) * 180) / Math.PI;
  const textCenterDirection = getStyleData(ele).textAlignment?.split(",")[0];
  let textRadiusDist: number = 0;
  let textTheta: number = 0;
  switch (textCenterDirection) {
    case "centerCenter":
      break;
    case "centerRight":
      textRadiusDist = textSize.width / 2;
      textTheta = 0;
      break;
    case "bottomRight":
      textRadiusDist = textSlope;
      textTheta = 360 - textAngle;
      break;
    case "bottomCenter":
      textRadiusDist = textSize.height / 2;
      textTheta = 270;
      break;
    case "bottomLeft":
      textRadiusDist = textSlope;
      textTheta = 180 + textAngle;
      break;
    case "centerLeft":
      textRadiusDist = textSize.width / 2;
      textTheta = 180;
      break;
    case "topLeft":
      textRadiusDist = textSlope;
      textTheta = 180 - textAngle;
      break;
    case "topCenter":
      textRadiusDist = textSize.height / 2;
      textTheta = 90;
      break;
    case "topRight":
      textRadiusDist = textSlope;
      textTheta = textAngle;
      break;
  }
  const textThetaRads = (textTheta * Math.PI) / 180;
  return { textRadiusDist, textThetaRads };
};

export const calculateCircleSvgParamsCm = (diameterCm: number) => {
  const circleEdgePadding = 2 / CSS_PIXELS_PER_CM; // pad to stop edge of SVG clipping circle

  // Calculate the width and height of the SVG in measured pixels without text alignment
  // The SVG is centred on the node and has to have room for the circle, hence the *2
  const unscaledDiameter = circleEdgePadding * 2 + diameterCm;

  // Calculate the required circle radius with scale
  const unscaledSvgCircleRadius = diameterCm / 2;

  // Calculate the centre of the circle in measured pixels without text alignment
  const unscaledTextCentre = unscaledDiameter / 2;

  return {
    svgWidth: unscaledDiameter,
    svgHeight: unscaledDiameter,
    svgCentreX: unscaledTextCentre,
    svgCentreY: unscaledTextCentre,
    svgCircleRadius: unscaledSvgCircleRadius,
  };
};

export const circleLabel = (
  ele: cytoscape.NodeSingular,
  cytoscapeCoordinateMapper: CytoscapeCoordinateMapper,
  params?: { backgroundColor?: string; labelColor?: string },
) => {
  const diameterCm = textDiameterCm(ele);
  const { svgWidth, svgHeight, svgCentreX, svgCentreY, svgCircleRadius } = calculateCircleSvgParamsCm(diameterCm);
  const { dy, dx } = textDimensionsCm(ele);

  return {
    svg: makeScaledSVG({
      symbolSvg: CircleSVG,
      centre: { x: svgCentreX * 1.2, y: svgCentreY * 1.2 },
      svg: { width: svgWidth, height: svgHeight },
      viewport: { width: svgWidth * 1.2, height: svgHeight * 1.2 },
      radius: svgCircleRadius,
      lineColor: (ele.data("fontColor") ?? FOREGROUND_COLOUR_BLACK) as string,
      ...getStyleData(ele),
      fontScaleFactor: cytoscapeCoordinateMapper.fontScaleFactor(),
      scaleFactor: cytoscapeCoordinateMapper.scalePixelsPerCm,
      labelColor: params?.labelColor,
      background: params?.backgroundColor
        ? {
            color: params.backgroundColor,
            height: dy,
            width: dx * 1.2, // adds x padding
          }
        : undefined,
    }),
    width: svgWidth,
    height: svgHeight,
  };
};

export const scaledFontSize = (ele: cytoscape.NodeSingular, cytoscapeCoordinateMapper: CytoscapeCoordinateMapper) => {
  return ele.data("fontSize") * cytoscapeCoordinateMapper.fontScaleFactor();
};

export const svgDataForSymbolFun =
  (cytoscapeCoordinateMapper: CytoscapeCoordinateMapper) => (ele: cytoscape.NodeSingular) => {
    // The symbolId is either a 2/3 digit ascii code or a character
    const symbolId = getStyleData(ele).symbolId ?? " ";
    const symbolSvg = isNaN(parseInt(symbolId)) ? symbolSvgs[symbolId.charCodeAt(0).toString()] : symbolSvgs[symbolId];
    if (!symbolSvg) {
      console.warn(`Symbol ${symbolId} not recognised`);
      return {
        svg: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>',
        width: 0,
        height: 0,
        nodeShape: "ellipse",
      };
    }

    const widthPixels = cytoscapeCoordinateMapper.planCmToCytoscape(
      (symbolSvg.widthPlanPixels * PIXELS_PER_POINT) / POINTS_PER_CM,
    );
    const heightPixels = cytoscapeCoordinateMapper.planCmToCytoscape(
      (symbolSvg.heightPlanPixels * PIXELS_PER_POINT) / POINTS_PER_CM,
    );

    return {
      svg: makeScaledSVG({
        symbolSvg: symbolSvg.svg,
        svg: { width: widthPixels, height: heightPixels },
        lineColor: FOREGROUND_COLOUR,
      }),
      width: widthPixels,
      height: heightPixels,
      nodeShape: symbolSvg.nodeShape,
    };
  };

export const getLabelText = (ele: cytoscape.NodeSingular) => {
  return ele.data("labelType") === "obsBearing" && ele.data("displayFormat") === "suppressSeconds"
    ? (ele.data("label") as string).replace(/00"/, "")
    : (ele.data("label") as string);
};
