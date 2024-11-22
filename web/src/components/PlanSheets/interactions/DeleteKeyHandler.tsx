import { EdgeSingular, NodeSingular } from "cytoscape";
import { ReactElement } from "react";

import { PlanMode } from "@/components/PlanSheets/PlanSheetType";
import { useCytoscapeContext } from "@/hooks/useCytoscapeContext";
import { useOnKeyDown } from "@/hooks/useOnKeyDown";
import { usePageLabelEdit } from "@/hooks/usePageLabelEdit";
import { usePageLineEdit } from "@/hooks/usePageLineEdit";

export type SelectHandlerMode = PlanMode.SelectLine | PlanMode.SelectLabel;

const SELECTED_PAGE_LABELS = `node[label][labelType="userAnnotation"][^invisible][^symbolId]:selected`;
const SELECTED_PAGE_LINES = `edge[lineId][lineType="userDefined"][^invisible][^pageConfig]:selected`;

export interface DeleteKeyHandlerProps {
  mode: SelectHandlerMode;
  labelTextInputOpen: boolean;
}

/**
 * Enable deletion of page elements for configured mode via pressing the Delete key.
 *
 * @param param0
 * @returns
 */
export function DeleteKeyHandler({ mode, labelTextInputOpen }: DeleteKeyHandlerProps): ReactElement {
  const { cyto } = useCytoscapeContext();
  const { deletePageLines } = usePageLineEdit();
  const { deletePageLabels } = usePageLabelEdit();

  const selector = getSelector(mode);

  useOnKeyDown(
    ({ key }) => key === "Delete",
    () => {
      const selectedElements = cyto?.$(selector);
      if (!selectedElements || selectedElements.length === 0) return;

      if (mode === PlanMode.SelectLine) {
        deletePageLines([...selectedElements] as EdgeSingular[]);
      } else if (mode === PlanMode.SelectLabel) {
        if (labelTextInputOpen) {
          // Prevent deletion of labels when editing label text
          return;
        }
        deletePageLabels([...selectedElements] as NodeSingular[]);
      }
    },
    false,
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
