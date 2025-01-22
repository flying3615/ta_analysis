import { isEmpty } from "lodash-es";
import { useCallback } from "react";

import { Layer } from "@/components/DefineDiagrams/MapLayers";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { useActionToast } from "@/hooks/useActionToast";
import { useSelectFeatures } from "@/hooks/useSelectFeaturesHook";
import { useConvertToRTLineMutation } from "@/queries/useConvertToRTLineMutation";
import { setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice";
import { s } from "@/util/stringUtil";

export interface useConvertToRTLineProps {
  transactionId: number;
  enabled: boolean;
}

export const useConvertToRTLine = ({ transactionId, enabled }: useConvertToRTLineProps) => {
  const actionToast = useActionToast();
  const dispatch = useAppDispatch();

  const { mutateAsync: convertToRtLine, isPending: loading } = useConvertToRTLineMutation();

  const { selectedFeatureIds: lineIds } = useSelectFeatures({
    enabled,
    locked: loading,
    layer: Layer.EXTINGUISHED_LINES,
  });

  const convertRtLines = useCallback(async () => {
    if (isEmpty(lineIds)) {
      return;
    }

    const action = `RT Line${s(lineIds)}`;
    await actionToast(
      () =>
        convertToRtLine({
          transactionId: transactionId,
          extinguishedLinesConvertRequestDTO: { lineIds },
        }),
      {
        errorMessage: `Adding ${action} failed due to`,
        successMessage: `${action} added successfully`,
      },
    );
    dispatch(setActiveAction("idle"));
  }, [lineIds, actionToast, dispatch, convertToRtLine, transactionId]);

  return {
    convertRtLines,
    loading,
    canCovertRtLine: !isEmpty(lineIds),
  };
};
