import { EdgeSingular, NodeSingular } from "cytoscape";
import { ReactElement } from "react";

import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useDeleteLabels } from "@/hooks/useDeleteLabels";
import { useDeleteLines } from "@/hooks/useDeleteLines";
import { useOnKeyDown } from "@/hooks/useOnKeyDown";

export type SelectHandlerMode = PlanMode.SelectLine | PlanMode.SelectLabel;

const SELECTED_PAGE_LABELS = `node[label][labelType="userAnnotation"][^invisible][^symbolId]:selected`;
const SELECTED_PAGE_LINES = `edge[lineId][lineType="userDefined"][^invisible][^pageConfig]:selected`;

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
  const deletePageLines = useDeleteLines();
  const deletePageLabels = useDeleteLabels();

  const selector = getSelector(mode);

  useOnKeyDown(
    ({ key }) => key === "Delete",
    () => {
      const selectedElements = cyto?.$(selector);
      if (!selectedElements || selectedElements.length === 0) return;

      if (mode === PlanMode.SelectLine) {
        deletePageLines([...selectedElements] as EdgeSingular[]);
      } else if (mode === PlanMode.SelectLabel) {
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
