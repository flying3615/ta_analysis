import { EdgeSingular, NodeSingular } from "cytoscape";
import { ReactElement } from "react";

import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useOnKeyDown } from "@/hooks/useOnKeyDown";
import { usePageLabelEdit } from "@/hooks/usePageLabelEdit";
import { usePageLineEdit } from "@/hooks/usePageLineEdit";

export type SelectHandlerMode = PlanMode.SelectLine | PlanMode.SelectLabel;

export const SELECTED_PAGE_LABELS = `node[label][labelType="userAnnotation"][^invisible][^symbolId]:selected`;
export const SELECTED_PAGE_LINES = `edge[lineId][lineType="userDefined"][^invisible][^pageConfig]:selected`;

export interface DeleteKeyHandlerProps {
  mode: SelectHandlerMode;
}

/**
 * Enable deletion of page elements for configured mode via pressing the Delete key.
 *
 * @param param0
 * @returns
 */
export function DeleteKeyHandler({ mode }: DeleteKeyHandlerProps): ReactElement {
  const { cyto } = useCytoscapeContext();
  const { deletePageLines } = usePageLineEdit();
  const { deletePageLabels } = usePageLabelEdit();

  const selector = getSelector(mode);

  useOnKeyDown(
    ({ key }) => key === "Delete",
    (e: KeyboardEvent) => {
      const selectedElements = cyto?.$(selector);
      if (!selectedElements || selectedElements.length === 0) return;

      const elementTarget = e.target instanceof HTMLElement ? e.target : null;
      const isTextInputTarget =
        elementTarget &&
        (elementTarget.nodeName === "TEXTAREA" ||
          (elementTarget.nodeName === "INPUT" && elementTarget.getAttribute("type") === "text"));

      if (mode === PlanMode.SelectLine) {
        deletePageLines([...selectedElements] as EdgeSingular[]);
      } else if (mode === PlanMode.SelectLabel) {
        if (isTextInputTarget) {
          // Prevent deletion of labels when editing label text
          return;
        }
        deletePageLabels([...selectedElements] as NodeSingular[]);
      }
    },
  );

  return <></>;
}

function getSelector(mode?: SelectHandlerMode) {
  if (mode === PlanMode.SelectLine) {
    return SELECTED_PAGE_LINES;
  } else if (mode === PlanMode.SelectLabel) {
    return SELECTED_PAGE_LABELS;
  }

  // TODO: "generic" to allow all types for first, then restrict?
  throw new Error(`SelectElementHandler mode=${mode} not implemented yet`);
}
