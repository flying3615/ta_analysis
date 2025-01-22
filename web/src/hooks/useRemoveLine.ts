import { isEmpty } from "lodash-es";
import { useCallback } from "react";

import { Layer } from "@/components/DefineDiagrams/MapLayers";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { useActionToast } from "@/hooks/useActionToast";
import { useSelectFeatures } from "@/hooks/useSelectFeaturesHook";
import { useRemoveLineMutation } from "@/queries/useRemoveLineMutation";
import { setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice";
import { s } from "@/util/stringUtil";

export interface useRemoveLineProps {
  transactionId: number;
  enabled: boolean;
}

export const useRemoveLine = ({ transactionId, enabled }: useRemoveLineProps) => {
  const actionToast = useActionToast();
  const dispatch = useAppDispatch();

  const { mutateAsync: removeLine, isPending: loading } = useRemoveLineMutation(transactionId);

  const { selectedFeatureIds: lineIds } = useSelectFeatures({
    enabled,
    locked: loading,
    layer: Layer.SELECT_LINES,
  });

  const removeRtLines = useCallback(async () => {
    if (isEmpty(lineIds)) return;

    const action = `Line${s(lineIds)}`;
    await actionToast(
      () =>
        removeLine({
          transactionId,
          deleteLinesRequestDTO: { lineIds },
        }),
      {
        successMessage: `${action} removed successfully`,
        errorMessage: `Removing ${action} failed due to`,
      },
    );

    dispatch(setActiveAction("idle"));
  }, [lineIds, actionToast, dispatch, removeLine, transactionId]);

  return {
    removeRtLines,
    loading,
    canRemoveRtLine: !isEmpty(lineIds),
  };
};
