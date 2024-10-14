import { EventObjectNode, NodeSingular } from "cytoscape";
import { useEffect, useState } from "react";

import { PlanElementSelector } from "@/components/PlanSheets/PlanElementType.ts";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";

import { SelectedDiagram } from "./SelectedDiagram";

export function SelectDiagramHandler() {
  const { cyto } = useCytoscapeContext();
  // TODO: store selected diagram id in redux, so selection preserved after re-render
  const [selectedDiagram, setSelectedDiagram] = useState<NodeSingular | undefined>();

  // select diagram
  useEffect(() => {
    const onSelect = (event: EventObjectNode) => {
      setSelectedDiagram(event.target);
    };

    const onUnselect = () => {
      setSelectedDiagram(undefined);
    };

    cyto?.on("select", PlanElementSelector.DiagramNode, onSelect);
    cyto?.on("unselect", PlanElementSelector.DiagramNode, onUnselect);
    cyto?.elements(PlanElementSelector.DiagramNode).selectify();

    return () => {
      onUnselect();
      cyto?.off("select", PlanElementSelector.DiagramNode, onSelect);
      cyto?.off("unselect", PlanElementSelector.DiagramNode, onUnselect);
      cyto?.elements(PlanElementSelector.DiagramNode).unselectify();
    };
  }, [cyto]);

  // add controls for move/resize when selected
  return <>{selectedDiagram && <SelectedDiagram diagram={selectedDiagram} />}</>;
}
