import cytoscape from "cytoscape";
import { max, sum } from "lodash-es";

import CircleSVG from "@/assets/symbols/circle.svg?raw";
import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import { makeScaledSVG } from "@/modules/plan/makeScaledSVG.ts";
import { pointsPerCm } from "@/util/cytoscapeUtil.ts";

export const LABEL_PADDING_PX = 1;
export const CIRCLE_FACTOR = 0.9;

const radiusForSquare = Math.sqrt(2.0);

export const textDimensions = (ele: cytoscape.NodeSingular) => {
  const fontSize = ele.data("fontSize");
  const fontName = ele.data("font");
  const lines = ele.data("label").split("\n");

  // Use the presumed cytoscape canvas to measure
  // text size in context
  const cyCanvas = document.querySelector('canvas[data-id="layer2-node"]') as HTMLCanvasElement;
  const cyContext = cyCanvas?.getContext("2d");

  if (cyContext) {
    cyContext.font = `${fontSize}px ${fontName}`; // order matters here
    const lineSizes = lines.map((l: string) => cyContext.measureText(l));

    const width = (max(lineSizes.map((ls: TextMetrics) => ls.width)) ?? 0) as number;
    const height = sum(lineSizes.map((ls: TextMetrics) => ls.fontBoundingBoxAscent + ls.fontBoundingBoxDescent));
    return { height, width };
  }

  // Fallback if we couldn't get the canvas context
  const height = lines.length * fontSize;
  const width = (max(lines.map((l: string) => l.length) as number[]) ?? 0) * fontSize;
  return { height, width };
};

export const textDiameter = (ele: cytoscape.NodeSingular) => {
  const { height, width } = textDimensions(ele);
  const longestSide = max([height, width]) ?? 0;

  return 2 * (longestSide / radiusForSquare) * CIRCLE_FACTOR;
};

export const textRotationClockwiseFromH = (ele: cytoscape.NodeSingular) => {
  const clockwiseDegrees = 360 - ele.data("textRotation");
  const resDegrees = clockwiseDegrees >= 360 ? clockwiseDegrees - 360 : clockwiseDegrees;

  return (resDegrees * Math.PI) / 180;
};

export const textRotationMathRads = (ele: cytoscape.NodeSingular) => {
  return ((ele.data("textRotation") ?? 0.0) * Math.PI) / 180;
};

const dbAlignmentHorizontal = (ele: cytoscape.NodeSingular): "Left" | "Center" | "Right" =>
  ele.data("textAlignment").match(/^[a-z]+([A-Z][a-z]+)/)?.[1];

export const textHAlign = (ele: cytoscape.NodeSingular) => {
  return (
    (
      {
        Left: "right",
        Center: "center",
        Right: "left",
      } as Record<string, string>
    )[dbAlignmentHorizontal(ele)] ?? "right"
  );
};

const signumHorizontal = (ele: cytoscape.NodeSingular) => {
  return (
    {
      Left: 1,
      Center: 0,
      Right: -1,
    }[dbAlignmentHorizontal(ele)] ?? -1
  );
};

// Cytoscape pads our labels inside the border
// but we also need to adjust the label location relative to the node
const paddingOffsetHorizontal = (ele: cytoscape.NodeSingular) => signumHorizontal(ele) * LABEL_PADDING_PX;

const signumVertical = (ele: cytoscape.NodeSingular) => {
  return (
    {
      bottom: 1,
      center: 0,
      top: -1,
    }[dbAlignmentVertical(ele)] ?? 0
  );
};

const paddingOffsetVertical = (ele: cytoscape.NodeSingular) => ((signumVertical(ele) + 1) * LABEL_PADDING_PX) / 2;

const dbAlignmentVertical = (ele: cytoscape.NodeSingular): "top" | "center" | "bottom" =>
  ele.data("textAlignment").match(/^([a-z]+)/)?.[1];

export const textVAlign = (ele: cytoscape.NodeSingular) => {
  return (
    (
      {
        top: "bottom",
        centre: "center",
        bottom: "top",
      } as Record<string, string>
    )[dbAlignmentVertical(ele)] ?? "center"
  );
};

export const fontStyle = (ele: cytoscape.NodeSingular) =>
  ["boldItalic", "italic"].includes(ele.data("fontStyle")) ? "italic" : "normal";
export const fontWeight = (ele: cytoscape.NodeSingular) =>
  ["boldItalic", "bold"].includes(ele.data("fontStyle")) ? "bold" : "normal";

export const textJustification = (ele: cytoscape.NodeSingular) =>
  (ele.data("textAlignment").match(/,text(\w+)$/)?.[1] ?? "Left").toLowerCase();

/**
 * Calculate the margin to apply,
 * This comprises the `pointOffset`, scaled and rotated
 * and the padding required around each label as per legacy
 *
 * @param ele
 * @param cytoscapeCoordinateMapper
 */
export const rotatedMargin = (ele: cytoscape.NodeSingular, cytoscapeCoordinateMapper: CytoscapeCoordinateMapper) => {
  const anchorAngle = ele.data("anchorAngle") ?? 0;
  const pointOffset = ele.data("pointOffset") ?? 0;
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
const calculateTextAlignmentPolar = (textSize: { width: number; height: number }, ele: cytoscape.NodeSingular) => {
  const textSlope = Math.sqrt((textSize.height * textSize.height) / 4 + (textSize.width * textSize.width) / 4);
  const textAngle = (Math.atan2(textSize.height, textSize.width) * 180) / Math.PI;
  const textCenterDirection = ele.data("textAlignment").split(",")[0];
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

export const calculateCircleSvgParams = (
  textSize: {
    width: number;
    height: number;
  },
  ele: cytoscape.NodeSingular,
  cytoscapeCoordinateMapper: CytoscapeCoordinateMapper,
  circleSize: number,
  offsetMargin: {
    x: number;
    y: number;
  },
) => {
  const circleEdgePadding = 2; // pad to stop edge of SVG clipping circle
  const { textRadiusDist, textThetaRads } = calculateTextAlignmentPolar(textSize, ele);

  // Conversion from measured pixels to cytoscape coordinates
  // Removes the effect of browser oom
  const measurePixelsToCytoscape = cytoscapeCoordinateMapper.fontScaleFactor();

  // Calculate the offset from the text centre to the anchor point per text alignment
  const horizontalAlignmentOffset = textRadiusDist * Math.cos(textRotationMathRads(ele) + textThetaRads);
  const verticalAlignmentOffset = textRadiusDist * Math.sin(textRotationMathRads(ele) + textThetaRads);

  // Calculate the width and height of the SVG in measured pixels without text alignment
  // The SVG is centred on the node and has to have room for the circle, hence the *2
  const unscaledWidth = circleEdgePadding * 2 + circleSize + Math.abs(horizontalAlignmentOffset) * 2;
  const unscaledHeight = circleEdgePadding * 2 + circleSize + Math.abs(verticalAlignmentOffset) * 2;

  // Scale these into cytoscape coordinates
  const scaledWidth = measurePixelsToCytoscape * unscaledWidth;
  const scaledHeight = measurePixelsToCytoscape * unscaledHeight;

  // Include the doubled offset to get our SVG width
  const svgWidth = scaledWidth + Math.abs(offsetMargin.x) * 2;
  const svgHeight = scaledHeight + Math.abs(offsetMargin.y) * 2;

  // Calculate the centre of the circle in measured pixels without text alignment
  const unscaledTextCentreX = unscaledWidth / 2 - horizontalAlignmentOffset;
  const unscaledTextCentreY = unscaledHeight / 2 + verticalAlignmentOffset;

  // Scale the circle centre into cytoscape coordinates
  // The offset margin has already been scaled
  const scaledTextCentreX = measurePixelsToCytoscape * unscaledTextCentreX + Math.abs(offsetMargin.x);
  const scaledTextCentreY = measurePixelsToCytoscape * unscaledTextCentreY + Math.abs(offsetMargin.y);

  // Shift the circle centre by the offset margin (hence allowing for text alignment
  const svgCentreX = scaledTextCentreX + offsetMargin.x;
  const svgCentreY = scaledTextCentreY + offsetMargin.y;

  // Calculate the required circle radius with scale
  const unscaledSvgCircleRadius = circleSize / 2;
  const scaledSvgCircleRadius = measurePixelsToCytoscape * unscaledSvgCircleRadius;
  return { svgWidth, svgHeight, svgCentreX, svgCentreY, scaledSvgCircleRadius };
};

export const circleLabel = (ele: cytoscape.NodeSingular, cytoscapeCoordinateMapper: CytoscapeCoordinateMapper) => {
  const circleSize = textDiameter(ele);
  const offsetMargin = rotatedMargin(ele, cytoscapeCoordinateMapper);
  const textSize = textDimensions(ele);
  const { svgWidth, svgHeight, svgCentreX, svgCentreY, scaledSvgCircleRadius } = calculateCircleSvgParams(
    textSize,
    ele,
    cytoscapeCoordinateMapper,
    circleSize,
    offsetMargin,
  );

  return makeScaledSVG(
    CircleSVG,
    svgWidth,
    svgHeight,
    "black",
    svgWidth,
    svgHeight,
    svgCentreX,
    svgCentreY,
    scaledSvgCircleRadius,
  );
};

export const scaledFontSize = (ele: cytoscape.NodeSingular, cytoscapeCoordinateMapper: CytoscapeCoordinateMapper) => {
  return ele.data("fontSize") * cytoscapeCoordinateMapper.fontScaleFactor();
};
