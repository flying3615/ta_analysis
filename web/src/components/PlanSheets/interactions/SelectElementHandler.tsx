import { CollectionReturnValue, EdgeSingular, EventObjectEdge, EventObjectNode, NodeSingular } from "cytoscape";
import { ReactElement, useEffect, useState } from "react";

import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";

import { MoveSelectedHandler } from "./MoveSelectedHandler";
import { getRelatedLabels } from "./selectUtil";

export type SelectHandlerMode = PlanMode.SelectCoordinates | PlanMode.SelectLabel | PlanMode.SelectLine;

const CLASS_RELATED_ELEMENT_SELECTED = "related-element-selected"; // select related label

// coordinates are both _coordinate elements_ and _symbol labels_
const SELECTOR_COORDINATES = `node[elementType='${PlanElementType.COORDINATES}'][^invisible],node[symbolId]`;
// labels are _all labels_ except _symbol labels_
const SELECTOR_LABELS = `node[label][^invisible][^symbolId]`;
const SELECTOR_LINES = `edge[lineId][^invisible][^pageConfig]`;

export interface SelectElementHandlerProps {
  // for generic select, make this optional and track selectMode in state after first feature selected.
  mode: SelectHandlerMode;
}

/**
 * Enable feature selection for configured mode.
 *
 * When a mark/line is selected, select related element
 * - broken node coordinate -> select line
 * - coordinate symbol -> select coordinate
 *
 * @param param0
 * @returns
 */
export function SelectElementHandler({ mode }: SelectElementHandlerProps): ReactElement {
  const { cyto } = useCytoscapeContext();
  const [selected, setSelected] = useState<CollectionReturnValue | undefined>();

  // track selection
  useEffect(() => {
    if (!cyto) {
      return;
    }

    const onSelect = () => {
      const selection = cyto.$(":selected");
      selection.forEach((ele) => {
        const related = getRelatedElements(ele);
        if (related && !selection.contains(related)) {
          selection.merge(related.select());
        }
      });

      setSelected(selection);
    };

    const onUnselect = (event?: EventObjectEdge | EventObjectNode) => {
      const selection = cyto.$(":selected");
      const element = event?.target;
      if (!element) {
        selection.unselect();
        setSelected(undefined);
        return;
      }

      const related = getRelatedElements(element);
      if (related && selection.contains(related)) {
        selection.unmerge(related.unselect());
      }
      setSelected(selection.nonempty() ? selection : undefined);
    };

    const onClick = (event: EventObjectEdge | EventObjectNode) => {
      if (event.originalEvent.ctrlKey || event.originalEvent.shiftKey) {
        return;
      }
      const clickedElement = event.target;

      const selected = cyto.elements(":selected");
      if (!selected.contains(clickedElement)) {
        // allow normal selection to occur
        return;
      }

      const related = getRelatedElements(clickedElement);
      const keepSelected = clickedElement.union(related || []);

      selected.difference(keepSelected).unselect();
      setSelected(keepSelected);
    };

    const selector = getSelector(mode);
    cyto.on("select", onSelect);
    cyto.on("unselect", onUnselect);
    cyto.on("click", selector, onClick);
    cyto.$(selector).selectify().style("events", "yes");

    return () => {
      cyto?.off("select", onSelect);
      cyto?.off("unselect", onUnselect);
      cyto?.off("click", selector, onClick);
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

  return <>{selected && <MoveSelectedHandler selectedElements={selected} />}</>;
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

function getRelatedElements(ele: EdgeSingular | NodeSingular): CollectionReturnValue | undefined {
  if (ele.isEdge() && ele.data("lineId")) {
    // include related broken/irregular segments
    return ele.cy().$(`edge[lineId='${ele.data("lineId")}']`);
  }

  if (ele.isNode() && ele.data("featureId") && ele.data("symbolId")) {
    // include coordinate for symbol
    return ele.cy().$id((ele.data("featureId") as number).toString());
  }

  return;
}
