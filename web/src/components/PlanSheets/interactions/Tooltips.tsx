import { LuiTooltip } from "@linzjs/lui";
import { Position } from "cytoscape";
import { useEffect, useState } from "react";

import { SelectHandlerMode } from "@/components/PlanSheets/interactions/SelectElementHandler";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";

export interface TooltipsProps {
  mode?: SelectHandlerMode;
}

export function Tooltips({ mode }: TooltipsProps) {
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<Position | null>(null);
  const { cyto } = useCytoscapeContext();

  useEffect(() => {
    if (!cyto) {
      return;
    }

    if (mode === PlanMode.SelectTargetLine) {
      setTooltipContent("Select a line to align label to");
    } else {
      setTooltipContent(null);
    }

    const updateTooltip = (event: cytoscape.EventObjectCore) => {
      const clientX = event.originalEvent.clientX;
      const clientY = event.originalEvent.clientY;
      setTooltipPosition({ x: clientX, y: clientY });
    };

    cyto?.on("mousemove", updateTooltip);

    return () => {
      cyto?.off("mousemove", updateTooltip);
    };
  }, [cyto, mode, setTooltipPosition]);

  return (
    <>
      {tooltipContent && tooltipPosition && (
        <LuiTooltip
          content={tooltipContent}
          visible={true}
          placement="right"
          appendTo={() => document.body}
          mode="info"
        >
          <div style={{ position: "absolute", top: tooltipPosition.y + 10, left: tooltipPosition.x + 10 }} />
        </LuiTooltip>
      )}
    </>
  );
}
