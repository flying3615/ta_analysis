import { EventObjectNode, NodeSingular } from "cytoscape";
import { useEffect, useState } from "react";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType.ts";
import { useAppSelector } from "@/hooks/reduxHooks.ts";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { getActivePageNumber } from "@/redux/planSheets/planSheetsSlice.ts";

import { SelectedDiagram } from "./SelectedDiagram";

const SELECTOR_DIAGRAM = `node[elementType='${PlanElementType.DIAGRAM}']`;

export function SelectDiagramHandler() {
  const { cyto } = useCytoscapeContext();
  // TODO: store selected diagram id in redux, so selection preserved after re-render
  const activePageNumber = useAppSelector(getActivePageNumber);
  const [selectedDiagram, setSelectedDiagram] = useState<NodeSingular | undefined>();

  useEffect(() => {
    setSelectedDiagram(undefined);
  }, [activePageNumber, setSelectedDiagram]);

  // select diagram
  useEffect(() => {
    const onSelect = (event: EventObjectNode) => {
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
