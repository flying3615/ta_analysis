import { LabelDTO, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { PlanCoordinateMapper } from "@/components/CytoscapeCanvas/PlanCoordinateMapper";
import { textAlignSignumHorizontal, textAlignSignumVertical } from "@/components/CytoscapeCanvas/textAlignment";
import { useMeasureText } from "@/hooks/useMeasureText";
import { POINTS_PER_CM } from "@/util/cytoscapeUtil";
import { addIntoDelta, addIntoPosition, angleDegrees360, Delta, deltaFromPolar } from "@/util/positionUtil";

export const useAdjustLoadedPlanData = () => {
  const measureTextCm = useMeasureText();

  const centrePointOffset = (textAlignment: string, labelSizeCm: Delta): Delta => {
    return {
      dx: (textAlignSignumHorizontal(textAlignment) * labelSizeCm.dx) / 2,
      dy: (textAlignSignumVertical(textAlignment) * labelSizeCm.dy) / 2,
    };
  };

  const relocateOffscreenLabel = (planCoordinateMapper: PlanCoordinateMapper, diagramId: number, label: LabelDTO) => {
    const labelSizeCm = measureTextCm(label.editedText ?? label.displayText ?? "", label.font, label.fontSize);

    const offset = centrePointOffset(label.textAlignment, labelSizeCm);

    const rOffsetCm = (label.pointOffset ?? 0) / POINTS_PER_CM;

    const originalShift = deltaFromPolar(label.anchorAngle, rOffsetCm);

    const labelPositionCm = planCoordinateMapper.groundCoordToCm(diagramId, label.position);

    const origLabelCentre = addIntoPosition(addIntoPosition(labelPositionCm, offset), originalShift);

    const xL = origLabelCentre.x - labelSizeCm.dx / 2;
    const offsideL = CytoscapeCoordinateMapper.diagramLimitOriginX - xL;
    const offsideR = xL - CytoscapeCoordinateMapper.diagramLimitBottomRightX;
    const yT = origLabelCentre.y + labelSizeCm.dy / 2;
    const offsideT = yT - CytoscapeCoordinateMapper.diagramLimitOriginY;
    const yB = origLabelCentre.y - labelSizeCm.dy / 2;
    const offsideB = CytoscapeCoordinateMapper.diagramLimitBottomRightY - yB;

    if (offsideL < 0 && offsideR < 0 && offsideT < 0 && offsideB < 0) return label;

    const unclipShift = {
      dx: offsideL > 0 ? offsideL : offsideR > 0 ? -offsideR : 0,
      dy: offsideT > 0 ? offsideT : offsideB > 0 ? -offsideB : 0,
    };

    const newShift = addIntoDelta(originalShift, unclipShift);

    label.pointOffset = Math.sqrt(newShift.dx ** 2 + newShift.dy ** 2) * POINTS_PER_CM;
    label.anchorAngle = angleDegrees360(-Math.atan2(newShift.dy, newShift.dx) * (180 / Math.PI));
    return label;
  };

  const adjustLoadedPlanData = (response: PlanResponseDTO): PlanResponseDTO => {
    const originAdjustedDiagrams = response.diagrams.map((diagram) => {
      return diagram.originPageOffset.x === 0 && diagram.originPageOffset.y === 0
        ? {
            ...diagram,
            originPageOffset: {
              x: CytoscapeCoordinateMapper.diagramLimitOriginX / 100,
              y: CytoscapeCoordinateMapper.diagramLimitOriginY / 100,
            },
          }
        : diagram;
    });

    const planCoordinateMapper = new PlanCoordinateMapper(originAdjustedDiagrams);

    return {
      ...response,

      diagrams: originAdjustedDiagrams.map((diagram) => {
        // TODO: this is just diagram labels
        const labelAdjustedDiagram = {
          ...diagram,
          labels: diagram.labels.map((label) => {
            return relocateOffscreenLabel(planCoordinateMapper, diagram.id, label);
          }),
          coordinateLabels: diagram.coordinateLabels.map((label) => {
            return relocateOffscreenLabel(planCoordinateMapper, diagram.id, label);
          }),
        };

        return labelAdjustedDiagram;
      }),
    };
  };
  return adjustLoadedPlanData;
};
