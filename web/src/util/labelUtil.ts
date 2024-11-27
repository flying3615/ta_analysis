import { max, min } from "lodash-es";

import { CSS_PIXELS_PER_CM } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { textAlignSignumHorizontal, textAlignSignumVertical } from "@/components/CytoscapeCanvas/textAlignment";
import { POINTS_PER_CM } from "@/util/cytoscapeUtil";
import { addIntoPosition, Delta, deltaFromPolar, Position, rotatePosition } from "@/util/positionUtil";

const centrePointOffset = (textAlignment: string, labelSizeCm: Delta): Delta => {
  return {
    dx: (textAlignSignumHorizontal(textAlignment) * labelSizeCm.dx) / 2,
    dy: (textAlignSignumVertical(textAlignment) * labelSizeCm.dy) / 2,
  };
};

export interface BoundingBoxWithShift {
  originalShift: Delta;
  xL: number;
  xR: number;
  yT: number;
  yB: number;
}

export const calculateLabelBoundingBox = (
  labelPositionCm: Position,
  labelSizeCm: Delta,
  textAlignment: string | undefined = undefined,
  anchorAngle: number | undefined = undefined,
  pointOffset: number | undefined = undefined,
  rotationAngle: number | undefined = undefined,
): BoundingBoxWithShift => {
  const offset = centrePointOffset(textAlignment ?? "centerCenter", labelSizeCm);
  const labelOffsetCm = (pointOffset ?? 0) / POINTS_PER_CM;
  const originalShift = deltaFromPolar(anchorAngle, labelOffsetCm);
  const unshiftedLabelCentre = addIntoPosition(labelPositionCm, offset);
  const origLabelCentre = addIntoPosition(unshiftedLabelCentre, originalShift);

  if (!rotationAngle || rotationAngle === 0) {
    const xL = origLabelCentre.x - labelSizeCm.dx / 2;
    const xR = origLabelCentre.x + labelSizeCm.dx / 2;
    const yT = origLabelCentre.y + labelSizeCm.dy / 2;
    const yB = origLabelCentre.y - labelSizeCm.dy / 2;
    return { originalShift, xL, xR, yT, yB };
  }

  const xL = unshiftedLabelCentre.x - labelSizeCm.dx / 2;
  const xR = unshiftedLabelCentre.x + labelSizeCm.dx / 2;
  const yT = unshiftedLabelCentre.y + labelSizeCm.dy / 2;
  const yB = unshiftedLabelCentre.y - labelSizeCm.dy / 2;

  const corners = [
    { x: xL, y: yT },
    { x: xR, y: yT },
    { x: xL, y: yB },
    { x: xR, y: yB },
  ];
  const rotatedCorners = corners.map((cp) => rotatePosition(cp, labelPositionCm, rotationAngle));
  const shiftedRotatedCorners = rotatedCorners.map((cp) => addIntoPosition(cp, originalShift));
  const xCorners = shiftedRotatedCorners.map((cp) => cp.x);
  const yCorners = shiftedRotatedCorners.map((cp) => cp.y);
  return {
    originalShift,
    xL: min(xCorners) ?? 0,
    yT: max(yCorners) ?? 0,
    xR: max(xCorners) ?? 0,
    yB: min(yCorners) ?? 0,
  };
};

/**
 * Use this from e.g. tests when we don't have a canvas to measure text properly on
 *
 * @param lines an array of text lines
 * @param fontSize the font size
 *
 */
export const measureTextFallback = (lines: string[], fontSize: number) => {
  const height = (lines.length * fontSize) / CSS_PIXELS_PER_CM;
  const width = ((max(lines.map((l: string) => l.length)) ?? 0) * fontSize) / CSS_PIXELS_PER_CM;
  return { dx: width, dy: height };
};
