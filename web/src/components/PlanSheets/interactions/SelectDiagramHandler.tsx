import { EventObjectNode, NodeSingular } from "cytoscape";
import { useCallback, useEffect, useState } from "react";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { useAppSelector } from "@/hooks/reduxHooks";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useEscapeKey } from "@/hooks/useEscape";
import { getActivePageNumber } from "@/redux/planSheets/planSheetsSlice";

import { SelectedDiagram } from "./SelectedDiagram";

const SELECTOR_DIAGRAM = `node[elementType='${PlanElementType.DIAGRAM}']`;

export function SelectDiagramHandler() {
  const { cyto } = useCytoscapeContext();
  // TODO: store selected diagram id in redux, so selection preserved after re-render
  const activePageNumber = useAppSelector(getActivePageNumber);
  const [selectedDiagram, setSelectedDiagram] = useState<NodeSingular | undefined>();

  const onUnselect = useCallback(() => {
    if (!cyto) {
      return;
    }
    setSelectedDiagram(undefined);
    cyto.$(":selected").deselect();
  }, [cyto]);

  useEscapeKey({ callback: onUnselect, enabled: true });

  useEffect(() => {
    setSelectedDiagram(undefined);
  }, [activePageNumber, setSelectedDiagram]);

  // select diagram
  useEffect(() => {
    const onSelect = (event: EventObjectNode) => {
      setSelectedDiagram(event.target);
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
  }, [cyto, onUnselect]);

  // add controls for move/resize when selected
  return <>{selectedDiagram && <SelectedDiagram diagram={selectedDiagram} />}</>;
}
