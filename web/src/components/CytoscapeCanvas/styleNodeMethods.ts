import cytoscape, { NodeSingular } from "cytoscape";
import { max, memoize, sum } from "lodash-es";

import CircleSVG from "@/assets/symbols/circle.svg?raw";
import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { symbolSvgs } from "@/components/CytoscapeCanvas/symbolSvgs";
import { makeScaledSVG } from "@/modules/plan/makeScaledSVG";
import { FOREGROUND_COLOUR } from "@/modules/plan/styling";
import { pixelsPerPoint, pointsPerCm } from "@/util/cytoscapeUtil";

export const LABEL_PADDING_PX = 4;
const PIXELS_PER_CM = 37.79;

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

function getStyleData(ele: cytoscape.NodeSingular): StyleData {
  return ele.data() as StyleData;
}

export const textDimensionsCm = (ele: cytoscape.NodeSingular) => {
  const { font, fontSize, label } = getStyleData(ele);
  if (!font || !fontSize || !label) {
    return { height: 0, width: 0 };
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

    return { height: height / PIXELS_PER_CM, width: width / PIXELS_PER_CM };
  }

  // Fallback if we couldn't get the canvas contex
  const height = lines.length * fontSize;
  const width = (max(lines.map((l: string) => l.length)) ?? 0) * fontSize;
  return { height: height / PIXELS_PER_CM, width: width / PIXELS_PER_CM };
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
  const { height, width } = textDimensionsCm(ele);
  const longestSide = max([height, width]) ?? 0;

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

interface TextAlignment {
  horizontal: "left" | "center" | "right";
  justify: "left" | "center" | "right";
  vertical: "bottom" | "center" | "top";
}

function getTextAlign(textAlignment?: string): TextAlignment | undefined {
  if (!textAlignment) {
    return;
  }
  let horizontal: TextAlignment["horizontal"] = "left";
  let justify: TextAlignment["justify"] = "left";
  let vertical: TextAlignment["vertical"] = "center";

  const [textAlign, textJustify] = textAlignment.split(",", 2);
  if (textAlign?.endsWith("Center")) {
    horizontal = "center";
  } else if (textAlign?.endsWith("Right")) {
    horizontal = "right";
  }

  if (textJustify?.endsWith("Center")) {
    justify = "center";
  } else if (textJustify?.endsWith("Right")) {
    justify = "right";
  }

  if (textAlign?.startsWith("bottom")) {
    vertical = "bottom";
  } else if (textAlign?.startsWith("top")) {
    vertical = "top";
  }

  return { horizontal, justify, vertical };
}

const memoizedTextAlign = memoize(getTextAlign);
const elementTextAlign = (ele: NodeSingular): TextAlignment | undefined =>
  memoizedTextAlign(getStyleData(ele).textAlignment);

export const textHAlign = (ele: cytoscape.NodeSingular): TextAlignment["horizontal"] =>
  (
    ({
      left: "right",
      center: "center",
      right: "left",
    }) as Record<TextAlignment["horizontal"], TextAlignment["horizontal"]>
  )[elementTextAlign(ele)?.horizontal ?? "left"]; // so default is "right" !?;

const signumHorizontal = (ele: cytoscape.NodeSingular): number =>
  ({
    left: 1,
    center: 0,
    right: -1,
  })[elementTextAlign(ele)?.horizontal ?? "right"];

// Cytoscape pads our labels inside the border
// but we also need to adjust the label location relative to the node
export const paddingOffsetHorizontal = (ele: cytoscape.NodeSingular) => signumHorizontal(ele) * LABEL_PADDING_PX;

const signumVertical = (ele: cytoscape.NodeSingular): number =>
  ({
    bottom: 1,
    center: 0,
    top: -1,
  })[elementTextAlign(ele)?.vertical ?? "center"];

export const paddingOffsetVertical = (ele: cytoscape.NodeSingular) =>
  ((signumVertical(ele) + 1) * LABEL_PADDING_PX) / 2;

export const textVAlign = (ele: cytoscape.NodeSingular): TextAlignment["vertical"] =>
  (
    ({
      bottom: "top",
      center: "center",
      top: "bottom",
    }) as Record<TextAlignment["vertical"], TextAlignment["vertical"]>
  )[elementTextAlign(ele)?.vertical ?? "center"];

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

  const cytoscapePixelOffset = cytoscapeCoordinateMapper.planCmToCytoscape(pointOffset / pointsPerCm);
  return {
    x: cytoscapePixelOffset * Math.cos(angleRadsAntiClockwise) + paddingOffsetHorizontal(ele),
    y: cytoscapePixelOffset * Math.sin(angleRadsAntiClockwise) + paddingOffsetVertical(ele),
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
  const circleEdgePadding = 2 / PIXELS_PER_CM; // pad to stop edge of SVG clipping circle

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

export const circleLabel = (ele: cytoscape.NodeSingular, cytoscapeCoordinateMapper: CytoscapeCoordinateMapper) => {
  const diameterCm = textDiameterCm(ele);
  const { svgWidth, svgHeight, svgCentreX, svgCentreY, svgCircleRadius } = calculateCircleSvgParamsCm(diameterCm);

  return {
    svg: makeScaledSVG({
      symbolSvg: CircleSVG,
      centre: { x: svgCentreX, y: svgCentreY },
      svg: { width: svgWidth * 0.8, height: svgHeight * 0.8 },
      viewport: { width: svgWidth, height: svgWidth },
      radius: svgCircleRadius,
      lineColor: "black",
      ...getStyleData(ele),
      fontScaleFactor: cytoscapeCoordinateMapper.fontScaleFactor(),
      scaleFactor: cytoscapeCoordinateMapper.scalePixelsPerCm,
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
      (symbolSvg.widthPlanPixels * pixelsPerPoint) / pointsPerCm,
    );
    const heightPixels = cytoscapeCoordinateMapper.planCmToCytoscape(
      (symbolSvg.heightPlanPixels * pixelsPerPoint) / pointsPerCm,
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
