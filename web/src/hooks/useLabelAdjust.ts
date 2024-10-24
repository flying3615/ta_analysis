import { CoordinateDTO, LabelDTO } from "@linz/survey-plan-generation-api-client";
import { last } from "lodash-es";

import { INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { useAppSelector } from "@/hooks/reduxHooks";
import { labelToNode } from "@/modules/plan/extractGraphData";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import { addIntoPosition, atanDegrees360, Delta, midPoint, Position, subtractIntoDelta } from "@/util/positionUtil";

export const useLabelAdjust = () => {
  const activeDiagrams = useAppSelector(selectActiveDiagrams);

  interface ShiftParams {
    startPosition: Position;
    endPosition: Position;
    startDelta: Delta;
    endDelta: Delta;
  }

  const applyShiftParams = (label: LabelDTO, shiftParams: ShiftParams) => {
    const { startPosition, endPosition, startDelta, endDelta } = shiftParams;
    const deltaMid = midPoint(startDelta, endDelta);
    const newLabelPosition = addIntoPosition(label.position, deltaMid);
    const lineDelta = subtractIntoDelta(endPosition, startPosition);

    // Note that in common with legacy the label can be flipped on its back here
    const anticlockwiseAngle = atanDegrees360(lineDelta);

    const angleChange = anticlockwiseAngle - label.rotationAngle;
    const adjustedAnchorAngle = label.anchorAngle + angleChange;

    return {
      ...label,
      position: newLabelPosition,
      rotationAngle: anticlockwiseAngle,
      anchorAngle: adjustedAnchorAngle,
    };
  };

  const adjustLabels = (movedNodesById: Record<number, INodeData>): INodeData[] => {
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

    const affectedLabels = activeDiagrams
      .flatMap((diagram) => diagram?.lineLabels)
      .filter((label) => label.featureType === "Line" && affectedLineIds.includes(label?.featureId ?? -1));

    const shiftParamsForLabel = (label: LabelDTO) => {
      const line = activeLines.find((line) => line?.id === label?.featureId);
      const lineStartId = line?.coordRefs?.[0] as number;
      const lineEndId = last(line?.coordRefs) as number;
      const lineStartCoord = affectedCoordinatesById[lineStartId] as CoordinateDTO;
      const lineEndCoord = affectedCoordinatesById[lineEndId] as CoordinateDTO;
      const lineStartPosition = movedNodesById[lineStartId]?.position ?? lineStartCoord?.position;
      const lineEndPosition = movedNodesById[lineEndId]?.position ?? lineEndCoord?.position;

      if (!lineStartPosition || !lineEndPosition) {
        throw new Error(`Line ${line?.id} must have start and end coordinates`);
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

    return affectedLabels.map((label) => {
      const labelDiagram = activeDiagrams.find((diagram) => diagram.lineLabels.some((l) => l.id === label.id));
      const shiftParams = shiftParamsForLabel(label);
      const labelDTO = applyShiftParams(label, shiftParams);

      const node = labelToNode(labelDTO);
      node.properties.diagramId = labelDiagram?.id;
      node.properties.elementType = PlanElementType.LINE_LABELS;
      return node;
    });
  };

  return adjustLabels;
};
