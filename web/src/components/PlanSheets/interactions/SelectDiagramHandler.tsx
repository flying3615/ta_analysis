import { EventObjectNode, NodeSingular } from "cytoscape";
import { useEffect, useState } from "react";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType.ts";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";

import { SelectedDiagram } from "./SelectedDiagram";

const SELECTOR_DIAGRAM = `node[elementType='${PlanElementType.DIAGRAM}']`;

export function SelectDiagramHandler() {
  const { cyto } = useCytoscapeContext();
  // TODO: store selected diagram id in redux, so selection preserved after re-render
  const [selectedDiagram, setSelectedDiagram] = useState<NodeSingular | undefined>();

  // select diagram
  useEffect(() => {
    const onSelect = (event: EventObjectNode) => {
      console.log("select diagram", event.target, event.originalEvent?.clientX, event.originalEvent?.clientY);
      setSelectedDiagram(event.target);
    };

    const onUnselect = () => {
      setSelectedDiagram(undefined);
    };

    cyto?.on("select", SELECTOR_DIAGRAM, onSelect);
    cyto?.on("unselect", SELECTOR_DIAGRAM, onUnselect);
    cyto?.elements(SELECTOR_DIAGRAM).selectify().style("events", "yes");

    return () => {
      onUnselect();
      cyto?.off("select", SELECTOR_DIAGRAM, onSelect);
      cyto?.off("unselect", SELECTOR_DIAGRAM, onUnselect);
      cyto?.elements(SELECTOR_DIAGRAM).unselectify().style("events", "no");
    };
  }, [cyto]);

  // add controls for move/resize when selected
  return <>{selectedDiagram && <SelectedDiagram diagram={selectedDiagram} />}</>;
}
