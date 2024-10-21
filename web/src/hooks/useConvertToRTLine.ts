import { ExtinguishedLinesControllerApi } from "@linz/survey-plan-generation-api-client";
import { useQueryClient } from "@tanstack/react-query";
import { isEmpty } from "lodash-es";
import { useCallback, useState } from "react";

import { Layer } from "@/components/DefineDiagrams/MapLayers";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { useSelectFeatures } from "@/hooks/useSelectFeaturesHook";
import { apiConfig } from "@/queries/apiConfig";
import { getLinesQueryKey } from "@/queries/lines";
import { setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice";
import { useShowToast } from "@/util/showToast";
import { s } from "@/util/stringUtil";

export interface useConvertToRTLineProps {
  transactionId: number;
  enabled: boolean;
}

export const useConvertToRTLine = ({ transactionId, enabled }: useConvertToRTLineProps) => {
  const [loading, setLoading] = useState(false);
  const { showSuccessToast, showErrorToast } = useShowToast();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const { selectedFeatureIds: lineIds } = useSelectFeatures({
    enabled,
    locked: loading,
    layer: Layer.EXTINGUISHED_LINES,
  });

  const convertRtLines = useCallback(async () => {
    if (isEmpty(lineIds)) return;

    try {
      setLoading(true);
      const { ok, message } = await new ExtinguishedLinesControllerApi(apiConfig()).convert({
        transactionId: transactionId,
        extinguishedLinesConvertRequestDTO: { lineIds },
      });

      if (!ok) return showErrorToast(message ?? "Unexpected exception adding RT lines");
      showSuccessToast(`RT Line${s(lineIds)} added successfully`);
      await queryClient.invalidateQueries({ queryKey: getLinesQueryKey(transactionId) });
    } finally {
      setLoading(false);
      dispatch(setActiveAction("idle"));
    }
  }, [dispatch, queryClient, lineIds, showErrorToast, showSuccessToast, transactionId]);

  return {
    convertRtLines,
    loading,
    canCovertRtLine: !isEmpty(lineIds),
  };
};
