import { useEffect } from "react";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType.ts";
import { PlanStyleClassName } from "@/components/PlanSheets/PlanSheetType.ts";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";

export interface PageNumberTooltipsProps {
  selector?: string;
}
export function ElementHover() {
  const { cyto } = useCytoscapeContext();

  useEffect(() => {
    if (!cyto) {
      return;
    }

    const onMouseOver = (event: cytoscape.EventObject) => {
      const element = event.target;
      element.addClass?.(PlanStyleClassName.ElementHover);

      if (element.data("elementType") === PlanElementType.DIAGRAM) {
        element.addClass(PlanStyleClassName.DiagramHover);
      } else if (element.data("diagramId")) {
        element.parent().addClass(PlanStyleClassName.DiagramHover);
      }
    };

    const onMouseOut = (event: cytoscape.EventObject) => {
      const element = event.target;
      element.removeClass(PlanStyleClassName.ElementHover);

      if (element.data("elementType") === PlanElementType.DIAGRAM) {
        element.removeClass(PlanStyleClassName.DiagramHover);
      } else if (element.data("diagramId")) {
        element.parent().removeClass(PlanStyleClassName.DiagramHover);
      }
    };

    cyto.on("mouseout", onMouseOut);
    cyto.on("mouseover", onMouseOver);

    return () => {
      cyto.off("mouseout", onMouseOut);
      cyto.off("mouseover", onMouseOver);
    };
  }, [cyto]);

  return <></>;
}
