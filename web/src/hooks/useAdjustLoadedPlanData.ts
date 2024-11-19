import { DiagramDTO, LabelDTO, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { PlanCoordinateMapper } from "@/components/CytoscapeCanvas/PlanCoordinateMapper";
import { textAlignSignumHorizontal, textAlignSignumVertical } from "@/components/CytoscapeCanvas/textAlignment";
import { useMeasureText } from "@/hooks/useMeasureText";
import { POINTS_PER_CM } from "@/util/cytoscapeUtil";
import { addIntoDelta, addIntoPosition, clampAngleDegrees360, Delta, deltaFromPolar } from "@/util/positionUtil";

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

    // console.log(`relocateOffscreenLabel label: ${JSON.stringify(label)}`);
    // console.log(
    //   `relocateOffscreenLabel labelSizeCm=${JSON.stringify(labelSizeCm)}, labelPositionCm=${JSON.stringify(labelPositionCm)}, offset=${JSON.stringify(offset)}, originalShift=${JSON.stringify(originalShift)}, origLabelCentre=${JSON.stringify(origLabelCentre)}`,
    // );

    const xL = origLabelCentre.x - labelSizeCm.dx / 2;
    const offsideL = CytoscapeCoordinateMapper.diagramLimitOriginX - xL;
    const xR = origLabelCentre.x + labelSizeCm.dx / 2;
    const offsideR = xR - CytoscapeCoordinateMapper.diagramLimitBottomRightX;
    const yT = origLabelCentre.y + labelSizeCm.dy / 2;
    const offsideT = yT - CytoscapeCoordinateMapper.diagramLimitOriginY;
    const yB = origLabelCentre.y - labelSizeCm.dy / 2;
    const offsideB = CytoscapeCoordinateMapper.diagramLimitBottomRightY - yB;

    if (offsideL <= 0 && offsideR <= 0 && offsideT <= 0 && offsideB <= 0) return label;

    const unclipShift = {
      dx: offsideL > 0 ? offsideL : offsideR > 0 ? -offsideR : 0,
      dy: offsideT > 0 ? -offsideT : offsideB > 0 ? offsideB : 0,
    };

    const newShift = addIntoDelta(originalShift, unclipShift);

    label.pointOffset = Math.sqrt(newShift.dx ** 2 + newShift.dy ** 2) * POINTS_PER_CM;
    label.anchorAngle = clampAngleDegrees360(Math.atan2(newShift.dy, newShift.dx) * (180 / Math.PI));
    // console.log(`relocateOffscreenLabel new pointOffset=${label.pointOffset}, new anchorAngle=${label.anchorAngle}`);
    return label;
  };

  const adjustDiagram = (diagram: DiagramDTO): DiagramDTO => {
    const originAdjustedDiagram =
      diagram.originPageOffset?.x === 0 && diagram.originPageOffset?.y === 0
        ? {
            ...diagram,
            originPageOffset: {
              x: CytoscapeCoordinateMapper.diagramLimitOriginX / 100,
              y: CytoscapeCoordinateMapper.diagramLimitOriginY / 100,
            },
          }
        : diagram;

    const planCoordinateMapper = new PlanCoordinateMapper([originAdjustedDiagram]);
    return {
      ...originAdjustedDiagram,
      labels: originAdjustedDiagram.labels?.map((label) => {
        return relocateOffscreenLabel(planCoordinateMapper, originAdjustedDiagram.id, label);
      }),
      coordinateLabels: originAdjustedDiagram.coordinateLabels?.map((label) => {
        return relocateOffscreenLabel(planCoordinateMapper, originAdjustedDiagram.id, label);
      }),
      parcelLabelGroups: originAdjustedDiagram.parcelLabelGroups?.map((group) => {
        return {
          ...group,
          labels: group.labels.map((label) =>
            relocateOffscreenLabel(planCoordinateMapper, originAdjustedDiagram.id, label),
          ),
        };
      }),
    };
  };

  const adjustPlanData = (response: PlanResponseDTO): PlanResponseDTO => {
    const diagrams = response.diagrams;
    return {
      ...response,

      diagrams: diagrams.map((d) => adjustDiagram(d)),
    };
  };

  return {
    adjustPlanData,
    adjustDiagram,
  };
};
