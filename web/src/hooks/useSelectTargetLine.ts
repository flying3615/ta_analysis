import { radiansToDegrees } from "@turf/helpers";
import { EdgeSingular } from "cytoscape";
import { useCallback } from "react";

import { findStartEndNodesForLine } from "@/components/PlanSheets/interactions/selectUtil";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useEscapeKey } from "@/hooks/useEscape";
import { usePlanSheetsDispatch } from "@/hooks/usePlanSheetsDispatch";
import { getAlignedLabelNodeId, getPlanMode, setPlanMode } from "@/redux/planSheets/planSheetsSlice";
import { clampAngleDegrees360 } from "@/util/positionUtil";

export const useSelectTargetLine = () => {
  const labelNodeId = useAppSelector(getAlignedLabelNodeId);
  const dispatch = useAppDispatch();

  const { cyto } = useCytoscapeContext();
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
          updateActiveDiagramsAndPageFromCytoData(labelNode.data({ textRotation: clampAngleDegrees360(lineAngle) }));

          dispatch(setPlanMode(PlanMode.SelectLabel));
        }
      }
    },
    [cyto, dispatch, labelNodeId, planMode, updateActiveDiagramsAndPageFromCytoData],
  );

  return {
    handleLabelAlignment,
  };
};
