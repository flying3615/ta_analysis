import { DiagramDTO } from "@linz/survey-plan-generation-api-client";
import { CollectionReturnValue, EventObjectEdge, EventObjectNode } from "cytoscape";
import { ReactElement, useEffect, useState } from "react";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";

import { MoveSelectedHandler } from "./MoveSelectedHandler";
import { getRelatedLabels } from "./selectUtil";

export type SelectHandlerMode = PlanMode.SelectCoordinates | PlanMode.SelectLabel | PlanMode.SelectLine;

const CLASS_RELATED_ELEMENT_SELECTED = "related-element-selected"; // select related label
const SELECTOR_COORDINATES = `node[elementType='${PlanElementType.COORDINATES}'][^invisible]`;
const SELECTOR_LABELS = `node[featureId][^invisible]`;
const SELECTOR_LINES = `edge[lineId][^invisible][^pageConfig]`;

export interface SelectElementHandlerProps {
  diagrams: DiagramDTO[];
  // for generic select, make this optional and track selectMode in state after first feature selected.
  mode: SelectHandlerMode;
}

/**
 * Enable feature selection for configured mode.
 *
 * When a mark/line is selected, select related element
 * - broken node coordinate -> select line
 *
 * @param param0
 * @returns
 */
export function SelectElementHandler({ diagrams, mode }: SelectElementHandlerProps): ReactElement {
  const { cyto } = useCytoscapeContext();
  const [selected, setSelected] = useState<CollectionReturnValue | undefined>();

  // track selection
  useEffect(() => {
    if (!cyto) {
      return;
    }

    const onSelect = (event: EventObjectEdge | EventObjectNode) => {
      const element = event.target;

      // TODO: expand selection instead of replace?
      const selection = cyto.collection();
      selection.merge(element);

      if (element.isEdge()) {
        // check for broken/irregular line made up of multiple elements
        const lineId = element.data("lineId");
        if (lineId) {
          selection.merge(cyto.$(`edge[lineId='${lineId}']`).select());
        }
      }

      setSelected(selection);
    };

    const onUnselect = () => {
      setSelected(undefined);
    };

    const selector = getSelector(mode);
    cyto.on("select", onSelect);
    cyto.on("unselect", onUnselect);
    cyto.$(selector).selectify().style("events", "yes");

    return () => {
      cyto?.off("select", onSelect);
      cyto?.off("unselect", onUnselect);
      cyto.$(selector).unselectify().style("events", "no");

      onUnselect();
    };
  }, [cyto, mode]);

  // highlight related labels
  useEffect(() => {
    if (!cyto || !selected) {
      return;
    }

    const relatedLabels = getRelatedLabels(selected);
    relatedLabels.addClass(CLASS_RELATED_ELEMENT_SELECTED);

    return () => {
      relatedLabels.removeClass(CLASS_RELATED_ELEMENT_SELECTED);
    };
  }, [cyto, selected]);

  return <>{selected && <MoveSelectedHandler diagrams={diagrams} selectedElements={selected} />}</>;
}

function getSelector(mode?: SelectHandlerMode) {
  if (mode === PlanMode.SelectCoordinates) {
    return SELECTOR_COORDINATES;
  } else if (mode === PlanMode.SelectLabel) {
    return SELECTOR_LABELS;
  } else if (mode === PlanMode.SelectLine) {
    return SELECTOR_LINES;
  }

  // TODO: "generic" to allow all types for first, then restrict?
  throw new Error(`SelectElementHandler mode=${mode} not implemented yet`);
}
