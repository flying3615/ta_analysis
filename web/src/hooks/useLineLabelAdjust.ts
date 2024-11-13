import { CoordinateDTO, LabelDTO, LineDTO } from "@linz/survey-plan-generation-api-client";
import { last, round } from "lodash-es";

import { INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { useAppSelector } from "@/hooks/reduxHooks";
import { labelToNode } from "@/modules/plan/extractGraphData";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import {
  addIntoPosition,
  angleDegrees360,
  atanDegrees360,
  Delta,
  midPoint,
  Position,
  subtractIntoDelta,
} from "@/util/positionUtil";

interface ShiftParams {
  startPosition: Position;
  endPosition: Position;
  startDelta: Delta;
  endDelta: Delta;
}

export const useLineLabelAdjust = () => {
  const activeDiagrams = useAppSelector(selectActiveDiagrams);

  const applyShiftParams = (label: LabelDTO, shiftParams: ShiftParams) => {
    const { startPosition, endPosition, startDelta, endDelta } = shiftParams;
    const deltaMid = midPoint(startDelta, endDelta);
    const newLabelPosition = addIntoPosition(label.position, deltaMid);
    const lineDelta = subtractIntoDelta(endPosition, startPosition);

    // Note that in common with legacy the label can be flipped on its back here
    const anticlockwiseAngle = atanDegrees360(lineDelta);

    const angleChange = anticlockwiseAngle - label.rotationAngle; // Note delta angles *can* be negative
    const adjustedAnchorAngle = angleDegrees360(label.anchorAngle + angleChange);

    return {
      ...label,
      position: newLabelPosition,
      rotationAngle: round(anticlockwiseAngle, 4),
      anchorAngle: round(adjustedAnchorAngle, 1),
    };
  };

  const shiftParamsForLabel = (
    affectedLine: LineDTO | undefined,
    affectedCoordinatesById: Record<string, CoordinateDTO>,
    movedNodesById: Record<number, INodeData>,
  ) => {
    const lineStartId = affectedLine?.coordRefs?.[0] as number;
    const lineEndId = last(affectedLine?.coordRefs) as number;
    const lineStartCoord = affectedCoordinatesById[lineStartId] as CoordinateDTO;
    const lineEndCoord = affectedCoordinatesById[lineEndId] as CoordinateDTO;
    const lineStartPosition = movedNodesById[lineStartId]?.position ?? lineStartCoord?.position;
    const lineEndPosition = movedNodesById[lineEndId]?.position ?? lineEndCoord?.position;

    if (!lineStartPosition || !lineEndPosition) {
      throw new Error(`Line ${affectedLine?.id} must have start and end coordinates`);
    }

    const originalStartPosition = lineStartCoord.position;
    const originalEndPosition = lineEndCoord.position;

    return {
      startPosition: lineStartPosition,
      endPosition: lineEndPosition,
      startDelta: subtractIntoDelta(lineStartPosition, originalStartPosition),
      endDelta: subtractIntoDelta(lineEndPosition, originalEndPosition),
    };
  };

  const adjustLabelsWithLine = (movedNodesById: Record<number, INodeData>): INodeData[] => {
    const activeLines = activeDiagrams.flatMap((diagram) => diagram?.lines);
    const affectedLines = activeLines.filter((line) => {
      return (
        Object.keys(movedNodesById).includes(line?.coordRefs?.[0]?.toString() ?? "") ||
        Object.keys(movedNodesById).includes(last(line?.coordRefs)?.toString() ?? "")
      );
    });

    const affectedCoordinateIds = affectedLines.flatMap((line) => line?.coordRefs ?? []);
    const affectedCoordinatesById = Object.fromEntries(
      activeDiagrams
        .flatMap((diagram) => diagram?.coordinates)
        .filter((coordinate) => affectedCoordinateIds.includes(coordinate.id))
        .map((coordinate) => [coordinate.id, coordinate]),
    );

    const affectedLineIds = affectedLines.map((line) => line?.id);
    const affectedLineLabels = activeDiagrams
      .flatMap((diagram) => diagram?.lineLabels)
      .filter((label) => label.featureType === "Line" && affectedLineIds.includes(label?.featureId ?? -1));

    return affectedLineLabels.map((label) => {
      const affectedLine = activeLines.find((line) => line?.id === label?.featureId);
      const labelDiagram = activeDiagrams.find((diagram) => diagram.lineLabels.some((l) => l.id === label.id));
      const shiftParams = shiftParamsForLabel(affectedLine, affectedCoordinatesById, movedNodesById);
      const labelDTO = applyShiftParams(label, shiftParams);

      const node = labelToNode(labelDTO);
      node.properties.diagramId = labelDiagram?.id;
      node.properties.elementType = PlanElementType.LINE_LABELS;
      return node;
    });
  };

  return adjustLabelsWithLine;
};
