import { DiagramsControllerApi } from "@linz/survey-plan-generation-api-client";
import { IFeatureSource } from "@linzjs/landonline-openlayers-map";
import { useQueryClient } from "@tanstack/react-query";
import { isEmpty } from "lodash-es";
import { useCallback, useState } from "react";

import { useAppDispatch } from "@/hooks/reduxHooks.ts";
import { apiConfig } from "@/queries/apiConfig";
import { getDiagramsQueryKey } from "@/queries/diagrams.ts";
import { getLabelsQueryKey } from "@/queries/labels.ts";
import { setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice.ts";
import { byId, useQueryDataUpdate } from "@/util/queryUtil.ts";
import { useShowToast } from "@/util/showToast.tsx";
import { s } from "@/util/stringUtil.ts";

export interface useRemoveDiagramsProps {
  transactionId: number;
  selectedDiagramIds: number[];
}

export const useRemoveDiagram = ({ transactionId, selectedDiagramIds: diagramIds }: useRemoveDiagramsProps) => {
  const [loading, setLoading] = useState(false);
  const { showSuccessToast, showErrorToast } = useShowToast();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const { removeQueryData } = useQueryDataUpdate<IFeatureSource>({ queryKey: getDiagramsQueryKey(transactionId) });

  const removeDiagrams = useCallback(async () => {
    if (isEmpty(diagramIds)) return;

    try {
      setLoading(true);
      const { ok, message } = await new DiagramsControllerApi(apiConfig()).deleteUserDefinedDiagrams({
        transactionId: transactionId,
        deleteDiagramsRequestDTO: { diagramIds: diagramIds },
      });
      if (!ok) return showErrorToast(message ?? "Unexpected exception removing user defined diagram");
      showSuccessToast(`Diagram${s(diagramIds)} removed successfully`);
      removeQueryData({ match: byId(diagramIds) });
      await queryClient.invalidateQueries({ queryKey: getLabelsQueryKey(transactionId) });
    } finally {
      setLoading(false);
      dispatch(setActiveAction("idle"));
    }
  }, [dispatch, removeQueryData, diagramIds, queryClient, showErrorToast, showSuccessToast, transactionId]);

  return {
    removeDiagrams,
    loading,
    canRemoveDiagram: !isEmpty(diagramIds),
  };
};
