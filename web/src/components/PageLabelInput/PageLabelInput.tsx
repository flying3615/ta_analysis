import { useCallback, useEffect, useState } from "react";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { useAppSelector } from "@/hooks/reduxHooks.ts";
import { useEscapeKey } from "@/hooks/useEscape";
import { getPlanMode } from "@/redux/planSheets/planSheetsSlice.ts";
import { cytoscapeUtils } from "@/util/cytoscapeUtil.ts";

interface InputLabelProps {
  cy: cytoscape.Core | undefined;
  cytoCoordMapper: CytoscapeCoordinateMapper | undefined;
}

export const PageLabelInput = ({ cy, cytoCoordMapper }: InputLabelProps) => {
  const [inputLabelPosition, setInputLabelPosition] = useState<cytoscape.Position | null>(null);
  const inputWidth = 250;
  const planMode = useAppSelector(getPlanMode);
  useEscapeKey({ callback: () => setInputLabelPosition(null) });

  const onClick = useCallback(
    (event: cytoscape.EventObject) => {
      if (!cy || !cytoCoordMapper) return;
      const diagramAreasLimits = cytoscapeUtils.getDiagramAreasLimits(cytoCoordMapper, cy);

      if (!diagramAreasLimits?.diagramOuterLimitsPx) return;
      // set the input position to the clicked position
      let inputPosition: cytoscape.Position | null = { x: event.originalEvent.clientX, y: event.originalEvent.clientY };
      const diagramArea = diagramAreasLimits.diagramOuterLimitsPx;

      // If the clicked position.x plus the input width is bigger than diagram area xMax, flip the input
      if (event.position.x + inputWidth > diagramArea?.xMax) {
        inputPosition = { x: event.originalEvent.clientX - inputWidth, y: event.originalEvent.clientY };
      }
      // If the clicked position is out of the diagram area, remove it
      if (!cytoscapeUtils.isPositionWithinAreaLimits(event.position, [diagramArea])) {
        inputPosition = null;
      }
      // If the clicked position is in a disabled area (eg. text block, pageNo), remove it
      if (cytoscapeUtils.isPositionWithinAreaLimits(event.position, diagramAreasLimits.disabledAreasLimitsPx)) {
        inputPosition = null;
      }

      setInputLabelPosition(inputPosition);
    },
    [cy, cytoCoordMapper],
  );

  useEffect(() => {
    planMode != PlanMode.AddLabel ? setInputLabelPosition(null) : cy?.on("click", onClick);
    return () => {
      cy?.removeListener("click", onClick);
    };
  }, [cy, cytoCoordMapper, planMode, onClick]);

  return (
    inputLabelPosition && (
      <textarea
        placeholder="Enter some text"
        style={{
          position: "absolute",
          top: inputLabelPosition.y,
          left: inputLabelPosition.x,
          zIndex: 1000,
          width: inputWidth,
        }}
      />
    )
  );
};
