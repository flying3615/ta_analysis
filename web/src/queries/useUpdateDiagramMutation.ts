import { DiagramDetailsControllerApi, UpdateUserDefinedDiagramRequest } from "@linz/survey-plan-generation-api-client";
import { useMutation } from "@tanstack/react-query";
import { Geometry } from "geojson";

import { IFeatureSourceDiagram, sortByDiagramsByType } from "@/components/DefineDiagrams/featureMapper.ts";
import { apiConfig } from "@/queries/apiConfig.ts";
import { getDiagramsQueryKey } from "@/queries/diagrams.ts";
import { useDiagramLabelsHook } from "@/queries/labels.ts";
import { byId, useQueryDataUpdate } from "@/util/queryUtil.ts";
import { useShowToast } from "@/util/showToast.tsx";

export interface useUpdateDiagramMutationProps {
  diagramType: string;
  geometry: Geometry;
  request: UpdateUserDefinedDiagramRequest;
}

/**
 * Update diagram mutation.  Optimistic update with rollback on error.
 */
export const useUpdateDiagramMutation = (transactionId: number) => {
  const diagramLabels = useDiagramLabelsHook(transactionId);
  const { getItem, updateQueryData } = useQueryDataUpdate<IFeatureSourceDiagram>({
    queryKey: getDiagramsQueryKey(transactionId),
    sortBy: sortByDiagramsByType,
  });
  const { showErrorToast } = useShowToast();

  return useMutation({
    onMutate: (vars: useUpdateDiagramMutationProps) => {
      const tempDiagram: IFeatureSourceDiagram = {
        id: vars.request.diagramId,
        diagramType: vars.diagramType,
        shape: { geometry: vars.geometry },
      };

      const oldItem = getItem((item) => item.id === vars.request.diagramId);
      if (!oldItem) throw Error("Unexpected item not found in query data");
      updateQueryData({ match: byId(vars.request.diagramId), withItem: tempDiagram });
      return { match: byId(vars.request.diagramId), withItem: oldItem };
    },
    mutationFn: (props: useUpdateDiagramMutationProps) => {
      return new DiagramDetailsControllerApi(apiConfig()).updateUserDefinedDiagram(props.request);
    },
    onError: (error, variables, revertUpdateQueryDataProps) => {
      console.error(error);
      showErrorToast("Unexpected error");
      revertUpdateQueryDataProps && updateQueryData(revertUpdateQueryDataProps);
    },
    onSuccess: async (response, _variables, revertUpdateQueryDataProps) => {
      if (!response.ok) {
        console.error(response);
        showErrorToast(response.message ?? "Unexpected error");
        updateQueryData(revertUpdateQueryDataProps);
        return;
      }

      await diagramLabels.updateLabels();
    },
  });
};
