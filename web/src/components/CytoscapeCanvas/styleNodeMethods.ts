import cytoscape from "cytoscape";
import { max, sum } from "lodash-es";

import CircleSVG from "@/assets/symbols/circle.svg?raw";
import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper.ts";
import { makeScaledSVG } from "@/modules/plan/makeScaledSVG.ts";
import { pointsPerCm } from "@/util/pixelConversions.ts";

export const LABEL_PADDING_PX = 2;

const radiusForSquare = Math.sqrt(2.0);

export const textDimensions = (ele: cytoscape.NodeSingular) => {
  const fontSize = ele.data("fontSize");
  const fontName = ele.data("font");
  const lines = ele.data("label").split("\n");

  // Use the presumed cytoscape canvas to measure
  // text size in context
  const cyCanvas = document.querySelector('canvas[data-id="layer2-node"]') as HTMLCanvasElement;
  const cyContext = cyCanvas.getContext("2d");

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

  return 2 * (longestSide / radiusForSquare);
};

export const textRotationClockwiseFromH = (ele: cytoscape.NodeSingular) => {
  const clockwiseDegrees = 360 - ele.data("textRotation");
  const resDegrees = clockwiseDegrees >= 360 ? clockwiseDegrees - 360 : clockwiseDegrees;

  return (resDegrees * Math.PI) / 180;
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

export const circleLabel = (ele: cytoscape.NodeSingular, cytoscapeCoordinateMapper: CytoscapeCoordinateMapper) => {
  const circleSize = textDiameter(ele);
  const margin = rotatedMargin(ele, cytoscapeCoordinateMapper);
  const textSize = textDimensions(ele);

  const circleEdgePadding = 2; // pad to stop edge of SVG clipping circle

  const horizontalAlignmentOffset = textSize.width * signumHorizontal(ele);
  const width = Math.abs(margin.x) * 2 + circleEdgePadding * 2 + circleSize + Math.abs(horizontalAlignmentOffset);
  const verticalAlignmentOffset = textSize.height * -signumVertical(ele);
  const height = Math.abs(margin.y) * 2 + circleEdgePadding * 2 + circleSize + Math.abs(verticalAlignmentOffset);

  return makeScaledSVG(
    CircleSVG,
    width,
    height,
    width,
    height,
    width / 2 + margin.x + horizontalAlignmentOffset / 2,
    height / 2 + margin.y + verticalAlignmentOffset / 2,
    circleSize / 2,
  );
};
