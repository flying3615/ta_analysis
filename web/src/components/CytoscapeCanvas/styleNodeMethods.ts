import cytoscape from "cytoscape";
import { max, sum } from "lodash-es";

import CircleSVG from "@/assets/symbols/circle.svg?raw";
import { makeScaledSVG } from "@/modules/plan/makeScaledSVG.ts";
import { pixelsPerPoint } from "@/util/pixelConversions.ts";

export const LABEL_PADDING_PX = 2;

const radiusForSquare = Math.sqrt(2.0);
const circleMargin = 8;

export const textDimensions = (ele: cytoscape.NodeSingular) => {
  const fontSize = ele.data("fontSize");
  const fontName = ele.data("font");
  const lines = ele.data("label").split("\n");

  // Use the presumed cytoscape canvas to measure
  // text size in context
  const cyCanvas = document.querySelector('canvas[data-id="layer2-node"]') as HTMLCanvasElement;
  const cyContext = cyCanvas.getContext("2d");

  if (cyContext) {
    cyContext.font = `${fontName} ${fontSize}px`;
    const lineSizes = lines.map((l: string) => cyContext.measureText(l));
    const width = (max(lineSizes.map((ls: TextMetrics) => ls.width)) ?? 0) as number;
    const height = sum(lineSizes.map((ls: TextMetrics) => ls.actualBoundingBoxAscent + ls.actualBoundingBoxDescent));
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
  return longestSide * radiusForSquare + circleMargin;
};

export const textMarginY = (ele: cytoscape.NodeSingular) => textDimensions(ele).height;

export const circleLabel = (ele: cytoscape.NodeSingular) => {
  const circleSize = textDiameter(ele);
  return makeScaledSVG({ svg: CircleSVG! }, circleSize, circleSize).svg;
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

// Cytoscape pads our labels inside the border
// but we also need to adjust the label location relative to the node
const paddingOffsetHorizontal = (ele: cytoscape.NodeSingular) => {
  return (
    {
      Left: LABEL_PADDING_PX,
      Center: 0,
      Right: -LABEL_PADDING_PX,
    }[dbAlignmentHorizontal(ele)] ?? -LABEL_PADDING_PX
  );
};

const paddingOffsetVertical = (ele: cytoscape.NodeSingular) => {
  return (
    {
      bottom: 0,
      center: LABEL_PADDING_PX / 2,
      top: LABEL_PADDING_PX,
    }[dbAlignmentVertical(ele)] ?? -LABEL_PADDING_PX
  );
};

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
 * @param ele
 */
export const rotatedMargin = (ele: cytoscape.NodeSingular) => {
  const anchorAngle = ele.data("anchorAngle");
  const pointOffset = ele.data("pointOffset");
  const angleRadsAntiClockwise = ((360.0 - anchorAngle) * Math.PI) / 180.0;

  return {
    x: pointOffset * pixelsPerPoint * Math.cos(angleRadsAntiClockwise) + paddingOffsetHorizontal(ele),
    y: pointOffset * pixelsPerPoint * Math.sin(angleRadsAntiClockwise) + paddingOffsetVertical(ele),
  };
};
