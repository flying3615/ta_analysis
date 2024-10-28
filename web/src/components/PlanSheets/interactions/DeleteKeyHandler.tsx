import { EdgeSingular } from "cytoscape";
import { ReactElement } from "react";

import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useDeleteLines } from "@/hooks/useDeleteLines";
import { useOnKeyDown } from "@/hooks/useOnKeyDown";

export type SelectHandlerMode = PlanMode.SelectLine; //| PlanMode.SelectLabel;

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

  const selector = getSelector(mode);

  useOnKeyDown(
    ({ key }) => key === "Delete",
    () => {
      const selectedElements = cyto?.$(selector);
      if (!selectedElements) return;

      if (mode === PlanMode.SelectLine) {
        deletePageLines([...selectedElements] as EdgeSingular[]);
      }
    },
  );

  return <></>;
}

function getSelector(mode?: SelectHandlerMode) {
  if (mode === PlanMode.SelectLine) {
    return SELECTED_PAGE_LINES;
  }

  // TODO: "generic" to allow all types for first, then restrict?
  throw new Error(`SelectElementHandler mode=${mode} not implemented yet`);
}
