import { LinesControllerApi } from "@linz/survey-plan-generation-api-client";
import { IFeatureSource } from "@linzjs/landonline-openlayers-map";
import { isEmpty } from "lodash-es";
import { useCallback, useState } from "react";

import { SELECT_LINES_LAYER_NAME } from "@/components/DefineDiagrams/MapLayers.ts";
import { useAppDispatch } from "@/hooks/reduxHooks.ts";
import { useSelectFeatures } from "@/hooks/useSelectFeaturesHook.ts";
import { apiConfig } from "@/queries/apiConfig";
import { getLinesQueryKey } from "@/queries/lines.ts";
import { setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice.ts";
import { clickedFeatureFilter } from "@/util/mapUtil.ts";
import { useQueryDataUpdate } from "@/util/queryUtil.ts";
import { useShowToast } from "@/util/showToast.tsx";
import { s } from "@/util/stringUtil.ts";

export interface useRemoveRtLineProps {
  transactionId: number;
  enabled: boolean;
}

export const useRemoveRtLine = ({ transactionId, enabled }: useRemoveRtLineProps) => {
  const [loading, setLoading] = useState(false);
  const { showSuccessToast, showErrorToast } = useShowToast();
  const dispatch = useAppDispatch();

  const { removeQueryData } = useQueryDataUpdate<IFeatureSource>({ queryKey: getLinesQueryKey(transactionId) });

  const { selectedFeatureIds: lineIds } = useSelectFeatures({
    enabled,
    locked: loading,
    layer: SELECT_LINES_LAYER_NAME,
    filterSelect: clickedFeatureFilter("symbolType", "CPG_LINE_CT"),
  });

  const removeRtLines = useCallback(async () => {
    if (!lineIds || isEmpty(lineIds)) return;

    try {
      setLoading(true);
      const { ok, message } = await new LinesControllerApi(apiConfig()).deleteLines({
        transactionId: transactionId,
        deleteLinesRequestDTO: { lineIds: lineIds },
      });
      if (!ok) return showErrorToast(message ?? "Unexpected exception removing RT lines");
      showSuccessToast(`RT line${s(lineIds)} removed successfully`);
      removeQueryData({ remove: lineIds });
    } finally {
      setLoading(false);
      dispatch(setActiveAction("idle"));
    }
  }, [dispatch, removeQueryData, lineIds, showErrorToast, showSuccessToast, transactionId]);

  return {
    removeRtLines,
    loading,
    canRemoveRtLine: !!lineIds,
  };
};
