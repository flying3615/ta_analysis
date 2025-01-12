import { CollectionReturnValue, EventObjectEdge, EventObjectNode } from "cytoscape";
import { ReactElement, useCallback, useEffect, useState } from "react";

import { Tooltips } from "@/components/PlanSheets/interactions/Tooltips";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useEscapeKey } from "@/hooks/useEscape";
import { useSelectTargetLine } from "@/hooks/useSelectTargetLine";

import { MoveSelectedHandler } from "./MoveSelectedHandler";
import { getRelatedElements, getRelatedLabels } from "./selectUtil";

export type SelectHandlerMode =
  | PlanMode.SelectCoordinates
  | PlanMode.SelectLabel
  | PlanMode.SelectLine
  | PlanMode.SelectTargetLine;

const CLASS_RELATED_ELEMENT_SELECTED = "related-element-selected"; // select related label

// Diagram coordinates have a diagramId (see PAGE_COORDS for inverse of this)
const DIAGRAM_COORDINATES = `node[elementType='${PlanElementType.COORDINATES}'][diagramId][^invisible]`;

// Symbol labels have a symbolId
const SYMBOL_LABELS = `node[symbolId]`;

// Selector for "coordinates" are both _coordinate elements_ and _symbol labels_ (BUT NOT "page coordinates")
const SELECTOR_COORDINATES = `${DIAGRAM_COORDINATES}, ${SYMBOL_LABELS}`;

// labels are _all labels_ except _symbol labels_
const SELECTOR_LABELS = `node[label][labelType][^invisible][^symbolId]`;

// The selector for "lines" is more complex, because the defined requirement for the "Select line" header button
// needs to select/move lines and also separately select/move coordinates. This is how legacy works. It was discussed
// in detail with the business. Do not change it without extensive discussion. This means the header button for
// "Select Coordinates" does not select and move Page line coordinates (do not change this).
const PAGE_LINES = `edge[lineId][^invisible][^pageConfig]`;

// Page coordinates do not have a diagramId
const PAGE_COORDS = `node[elementType='${PlanElementType.COORDINATES}'][^diagramId][^invisible]`;

// Selector for the header button "Select lines" is both _page lines_ and _page coordinates_
const SELECTOR_LINES = `${PAGE_LINES}, ${PAGE_COORDS}`;

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
  const { cyto, setSelectedElementIds } = useCytoscapeContext();
  const { handleLabelAlignment } = useSelectTargetLine();
  const [selected, setSelected] = useState<CollectionReturnValue | undefined>();

  const onUnselect = useCallback(
    (event?: EventObjectEdge | EventObjectNode) => {
      if (!cyto) {
        return;
      }

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
    },
    [cyto],
  );

  useEscapeKey({ callback: onUnselect, enabled: true });

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

      // When in align to line mode, do not save the target line for reselect, but keep the selected label id
      if (mode !== PlanMode.SelectTargetLine) {
        setSelectedElementIds(selection.map((ele) => ele.id()));
      }
    };

    const onClick = (event: EventObjectEdge | EventObjectNode) => {
      if (event.originalEvent.ctrlKey || event.originalEvent.shiftKey) {
        return;
      }

      if (mode === PlanMode.SelectTargetLine) {
        event.target.isEdge() && handleLabelAlignment(event.target);
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
    const selectableClass = getSelectableClass(mode);

    cyto.on("select", onSelect);
    cyto.on("unselect", onUnselect);
    cyto.on("click", selector, onClick);
    selectableClass && cyto.$(selector).addClass(selectableClass);
    cyto.$(selector).selectify().style("events", "yes");

    return () => {
      cyto?.off("select", onSelect);
      cyto?.off("unselect", onUnselect);
      cyto?.off("click", selector, onClick);
      cyto.$(selector).unselectify().style("events", "no");

      onUnselect();
    };
  }, [cyto, handleLabelAlignment, mode, onUnselect, setSelectedElementIds]);

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

  return (
    <>
      {selected && <MoveSelectedHandler selectedElements={selected} mode={mode} />}
      <Tooltips mode={mode} />
    </>
  );
}

function getSelector(mode?: SelectHandlerMode) {
  if (mode === PlanMode.SelectCoordinates) {
    return SELECTOR_COORDINATES;
  } else if (mode === PlanMode.SelectLabel) {
    return SELECTOR_LABELS;
  } else if (mode === PlanMode.SelectLine) {
    return SELECTOR_LINES;
  } else if (mode === PlanMode.SelectTargetLine) {
    return SELECTOR_LINES;
  }

  // TODO: "generic" to allow all types for first, then restrict?
  throw new Error(`SelectElementHandler mode=${mode} not implemented yet`);
}

function getSelectableClass(mode?: SelectHandlerMode) {
  if (mode === PlanMode.SelectLabel) {
    return "selectable-label";
  }
  return undefined;
}
