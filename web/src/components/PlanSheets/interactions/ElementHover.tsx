import cytoscape from "cytoscape";
import { useEffect } from "react";

import { getRelatedElements } from "@/components/PlanSheets/interactions/selectUtil";
import { PlanStyleClassName } from "@/components/PlanSheets/PlanSheetType";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";

export function ElementHover() {
  const { cyto } = useCytoscapeContext();
  const hoverSelector = `node,edge`;

  useEffect(() => {
    if (!cyto) {
      return;
    }

    const onMouseOver = (event: cytoscape.EventObjectEdge | cytoscape.EventObjectNode) => {
      const element = event.target;
      element.addClass(PlanStyleClassName.ElementHover);
      getRelatedElements(element)?.forEach((relatedElement) => {
        relatedElement.addClass(PlanStyleClassName.ElementHover);
      });
    };

    const onMouseOut = (event: cytoscape.EventObjectEdge | cytoscape.EventObjectNode) => {
      const element = event.target;
      element.removeClass(PlanStyleClassName.ElementHover);
      getRelatedElements(element)?.forEach((relatedElement) => {
        relatedElement.removeClass(PlanStyleClassName.ElementHover);
      });
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
