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
import { normalizeAngle } from "@/util/positionUtil";

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

        const lineAngle = radiansToDegrees(-Math.atan2(endY - startY, endX - startX));

        if (labelNodeId && cyto) {
          const labelNode = cyto.$id(labelNodeId);
          updateActiveDiagramsAndPageFromCytoData(labelNode.data({ textRotation: normalizeAngle(lineAngle) }));

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
