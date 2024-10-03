import { LuiTooltip } from "@linzjs/lui";
import { Position } from "cytoscape";
import { useEffect, useState } from "react";

import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";

export interface PageNumberTooltipsProps {
  selector?: string;
}
export function PageNumberTooltips({ selector = "node#border_page_no" }: PageNumberTooltipsProps) {
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<Position | null>(null);
  const { cyto } = useCytoscapeContext();

  useEffect(() => {
    if (!cyto) {
      return;
    }

    const onMouseOut = () => {
      setTooltipContent(null);
      setTooltipPosition(null);
    };

    const onMouseOver = (event: cytoscape.EventObject) => {
      const { x: x0, y: y0 } = cyto?.container()?.getBoundingClientRect() ?? { x: 0, y: 0 };
      const { x, y } = event.target.renderedPosition();

      setTooltipContent("Reserved for sheet numbers");
      setTooltipPosition({ x: x + x0, y: y + y0 });
    };

    cyto.on("mouseout", selector, onMouseOut);
    cyto.on("mouseover", selector, onMouseOver);

    return () => {
      cyto.off("mouseout", selector, onMouseOut);
      cyto.off("mouseover", selector, onMouseOver);
    };
  }, [cyto, selector, setTooltipContent, setTooltipPosition]);

  return (
    <>
      {tooltipContent && tooltipPosition && (
        <LuiTooltip content={tooltipContent} visible={true} placement="left" appendTo={() => document.body}>
          <div style={{ position: "absolute", top: tooltipPosition.y, left: tooltipPosition.x - 20 }} />
        </LuiTooltip>
      )}
    </>
  );
}
