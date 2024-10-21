import { DiagramsControllerApi } from "@linz/survey-plan-generation-api-client";
import { IFeatureSource } from "@linzjs/landonline-openlayers-map";
import { useQueryClient } from "@tanstack/react-query";
import { isEmpty } from "lodash-es";
import { useCallback, useState } from "react";

import { useAppDispatch } from "@/hooks/reduxHooks";
import { apiConfig } from "@/queries/apiConfig";
import { getOpenlayersDiagramsQueryKey } from "@/queries/diagrams";
import { getDiagramLabelsQueryKey } from "@/queries/labels";
import { setActiveAction } from "@/redux/defineDiagrams/defineDiagramsSlice";
import { byId, useQueryDataUpdate } from "@/util/queryUtil";
import { useShowToast } from "@/util/showToast";
import { s } from "@/util/stringUtil";

export interface useRemoveDiagramsProps {
  transactionId: number;
  selectedDiagramIds: number[];
}

export const useRemoveDiagram = ({ transactionId, selectedDiagramIds: diagramIds }: useRemoveDiagramsProps) => {
  const [loading, setLoading] = useState(false);
  const { showSuccessToast, showErrorToast } = useShowToast();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const { removeQueryData } = useQueryDataUpdate<IFeatureSource>({
    queryKey: getOpenlayersDiagramsQueryKey(transactionId),
  });

  const removeDiagrams = useCallback(async () => {
    if (isEmpty(diagramIds)) return;

    try {
      setLoading(true);
      const { ok, message } = await new DiagramsControllerApi(apiConfig()).deleteUserDefinedDiagrams({
        transactionId: transactionId,
        deleteDiagramsRequestDTO: { diagramIds: diagramIds },
      });
      if (!ok) return showErrorToast(message ?? "Unexpected exception removing user defined diagram");
      await queryClient.invalidateQueries({ queryKey: getDiagramLabelsQueryKey(transactionId) });
      removeQueryData({ match: byId(diagramIds) });
      showSuccessToast(`Diagram${s(diagramIds)} removed successfully`);
    } finally {
      setLoading(false);
      dispatch(setActiveAction("idle"));
    }
  }, [diagramIds, transactionId, showErrorToast, showSuccessToast, removeQueryData, queryClient, dispatch]);

  return {
    removeDiagrams,
    loading,
    canRemoveDiagram: !isEmpty(diagramIds),
  };
};
