import { isEmpty } from "lodash-es";
import { useCallback } from "react";

import { useAppDispatch } from "@/hooks/reduxHooks";
import { useActionToast } from "@/hooks/useActionToast";
import { useRemoveDiagramMutation } from "@/queries/useRemoveDiagramMutation";
import { setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice";
import { s } from "@/util/stringUtil";

export interface useRemoveDiagramsProps {
  transactionId: number;
  selectedDiagramIds: number[];
}

export const useRemoveDiagram = ({ transactionId, selectedDiagramIds: diagramIds }: useRemoveDiagramsProps) => {
  const actionToast = useActionToast();
  const dispatch = useAppDispatch();
  const { mutateAsync: removeDiagram, isPending: loading } = useRemoveDiagramMutation(transactionId);

  const removeDiagrams = useCallback(async () => {
    if (isEmpty(diagramIds)) return;

    await actionToast(
      () =>
        removeDiagram({
          transactionId: transactionId,
          deleteDiagramsRequestDTO: { diagramIds: diagramIds },
        }),
      {
        successMessage: `Diagram${s(diagramIds)} removed successfully`,
        errorMessage: "Removing user defined diagram failed due to",
      },
    );
    dispatch(setActiveAction("idle"));
  }, [diagramIds, actionToast, dispatch, removeDiagram, transactionId]);

  return {
    removeDiagrams,
    loading,
    canRemoveDiagram: !isEmpty(diagramIds),
  };
};
