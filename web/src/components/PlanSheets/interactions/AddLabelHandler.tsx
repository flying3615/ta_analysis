import cytoscape from "cytoscape";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { LabelTextInput } from "@/components/LabelTextInput/LabelTextInput";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useEscapeKey } from "@/hooks/useEscape";
import { setPlanMode } from "@/redux/planSheets/planSheetsSlice";
import { cytoscapeUtils } from "@/util/cytoscapeUtil";

export const AddLabelHandler = () => {
  const { cyto } = useCytoscapeContext();
  const container = cyto?.container();
  const cytoCoordMapper = useMemo(() => (container ? new CytoscapeCoordinateMapper(container, []) : null), [container]);

  const [inputPosition, setInputPosition] = useState<cytoscape.Position>();
  const [labelPosition, setLabelPosition] = useState<cytoscape.Position>();

  const dispatch = useAppDispatch();
  useEscapeKey({
    callback: () => {
      setInputPosition(undefined);
      dispatch(setPlanMode(PlanMode.Cursor));
    },
  });

  const inputWidth = 250;

  const onClick = useCallback(
    (event: cytoscape.EventObjectCore | cytoscape.EventObjectNode) => {
      if (!cyto || !cytoCoordMapper) return;

      const diagramAreasLimits = cytoscapeUtils.getDiagramAreasLimits(cytoCoordMapper, cyto);
      if (!diagramAreasLimits?.diagramOuterLimitsPx) return;
      const diagramArea = diagramAreasLimits.diagramOuterLimitsPx;

      // set the input position to the clicked position
      let inputPosition: cytoscape.Position | undefined = {
        x: event.originalEvent.clientX,
        y: event.originalEvent.clientY,
      };
      setLabelPosition(event.position);

      // If the clicked position.x plus the input width is bigger than diagram area xMax, flip the input
      if (event.position.x + inputWidth > diagramArea?.x2) {
        inputPosition = { x: event.originalEvent.clientX - inputWidth, y: event.originalEvent.clientY };
      }
      // If the clicked position is out of the diagram area, remove it
      if (!cytoscapeUtils.isPositionWithinAreaLimits(event.position, [diagramArea])) {
        inputPosition = undefined;
      }
      // If the clicked position is in a disabled area (eg. text block, pageNo), remove it
      if (cytoscapeUtils.isPositionWithinAreaLimits(event.position, diagramAreasLimits.disabledAreasLimitsPx)) {
        inputPosition = undefined;
      }
      setInputPosition(inputPosition);
    },
    [cyto, cytoCoordMapper],
  );

  useEffect(() => {
    cyto?.on("click", onClick);
    return () => {
      cyto?.off("click", onClick);
    };
  }, [cyto, onClick]);

  return inputPosition && <LabelTextInput inputPosition={inputPosition} labelPosition={labelPosition} />;
};
