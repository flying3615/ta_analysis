import { radiansToDegrees } from "@turf/helpers";
import { EdgeSingular } from "cytoscape";
import { useCallback, useMemo } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { findStartEndNodesForLine } from "@/components/PlanSheets/interactions/selectUtil";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { getCorrectedLabelPosition } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useEscapeKey } from "@/hooks/useEscape";
import { usePlanSheetsDispatch } from "@/hooks/usePlanSheetsDispatch";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import { getAlignedLabelNodeId, getPlanMode, setPlanMode } from "@/redux/planSheets/planSheetsSlice";
import { clampAngleDegrees360 } from "@/util/positionUtil";

export const useSelectTargetLine = () => {
  const labelNodeId = useAppSelector(getAlignedLabelNodeId);
  const activeDiagrams = useAppSelector(selectActiveDiagrams);
  const dispatch = useAppDispatch();

  const { cyto } = useCytoscapeContext();
  const container = cyto?.container();
  const cytoCoordMapper = useMemo(
    () => (container ? new CytoscapeCoordinateMapper(container, activeDiagrams) : null),
    [container, activeDiagrams],
  );
  const planMode = useAppSelector(getPlanMode);

  const { updateActiveDiagramsAndPageFromCytoData } = usePlanSheetsDispatch();

  useEscapeKey({
    callback: () => {
      planMode === PlanMode.SelectTargetLine && dispatch(setPlanMode(PlanMode.SelectLabel));
    },
  });

  const handleLabelAlignment = useCallback(
    (targetLine: EdgeSingular) => {
      if (planMode !== PlanMode.SelectTargetLine) return;

      const { startNode, endNode } = findStartEndNodesForLine(targetLine);

      if (startNode && endNode) {
        const { x: startX, y: startY } = startNode.position();
        const { x: endX, y: endY } = endNode.position();

        let lineAngle = radiansToDegrees(-Math.atan2(endY - startY, endX - startX));

        // Convert lineAngle to -90 to 90
        if (lineAngle > 90) {
          lineAngle -= 180;
        } else if (lineAngle < -90) {
          lineAngle += 180;
        }

        if (labelNodeId && cyto) {
          const labelNode = cyto.$id(labelNodeId);

          const positionCoord = getCorrectedLabelPosition(cyto, cytoCoordMapper, labelNodeId, "alignToLine", {
            rotationAngle: lineAngle,
            id: Number(labelNodeId.replace("LAB_", "")),
          });

          // update a clone to avoid render flicker and reverse the angle within 0-360 range
          const modifiedLabel = labelNode.clone();
          modifiedLabel.data({ textRotation: clampAngleDegrees360(lineAngle) });
          if (positionCoord) {
            modifiedLabel.position(positionCoord);
          }

          updateActiveDiagramsAndPageFromCytoData(modifiedLabel);

          dispatch(setPlanMode(PlanMode.SelectLabel));
        }
      }
    },
    [cyto, cytoCoordMapper, dispatch, labelNodeId, planMode, updateActiveDiagramsAndPageFromCytoData],
  );

  return {
    handleLabelAlignment,
  };
};
