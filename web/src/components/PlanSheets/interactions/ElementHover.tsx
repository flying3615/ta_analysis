import { useEffect } from "react";

import { PlanStyleClassName } from "@/components/PlanSheets/PlanSheetType.ts";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";

export function ElementHover() {
  const { cyto } = useCytoscapeContext();
  const hoverSelector = `node,edge`;

  useEffect(() => {
    if (!cyto) {
      return;
    }

    const onMouseOver = (event: cytoscape.EventObject) => {
      const element = event.target;
      element.addClass(PlanStyleClassName.ElementHover);
    };

    const onMouseOut = (event: cytoscape.EventObject) => {
      const element = event.target;
      element.removeClass(PlanStyleClassName.ElementHover);
    };

    cyto.on("mouseout", hoverSelector, onMouseOut);
    cyto.on("mouseover", hoverSelector, onMouseOver);

    return () => {
      cyto.off("mouseout", hoverSelector, onMouseOut);
      cyto.off("mouseover", hoverSelector, onMouseOver);
    };
  }, [cyto, hoverSelector]);

  return <></>;
}
