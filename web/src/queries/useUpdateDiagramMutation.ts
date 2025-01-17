import { DiagramDetailsControllerApi, UpdateUserDefinedDiagramRequest } from "@linz/survey-plan-generation-api-client";
import { useMutation } from "@tanstack/react-query";
import { Geometry } from "geojson";

import { IFeatureSourceDiagram, sortByDiagramsByType } from "@/components/DefineDiagrams/featureMapper";
import { apiConfig } from "@/queries/apiConfig";
import { getOpenlayersDiagramsQueryKey } from "@/queries/diagrams";
import { useDiagramLabelsHook } from "@/queries/labels";
import { byId, useQueryDataUpdate } from "@/util/queryUtil";

export interface useUpdateDiagramMutationProps {
  diagramType: string;
  geometry: Geometry;
  request: UpdateUserDefinedDiagramRequest;
}

export class UpdateDiagramError extends Error {}

/**
 * Update diagram mutation.  Optimistic update with rollback on error.
 */
export const useUpdateDiagramMutation = (transactionId: number) => {
  const diagramLabels = useDiagramLabelsHook(transactionId);
  const { getItem, updateQueryData } = useQueryDataUpdate<IFeatureSourceDiagram>({
    queryKey: getOpenlayersDiagramsQueryKey(transactionId),
    sortBy: sortByDiagramsByType,
  });

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
    mutationFn: async (props: useUpdateDiagramMutationProps) => {
      const response = await new DiagramDetailsControllerApi(apiConfig()).updateUserDefinedDiagram(props.request);
      if (!response.ok) {
        throw new UpdateDiagramError(response.message ?? "Unexpected error");
      }
      return response;
    },
    onError: (_error, _variables, revertUpdateQueryDataProps) => {
      revertUpdateQueryDataProps && updateQueryData(revertUpdateQueryDataProps);
    },
    onSuccess: async () => await diagramLabels.updateLabels(),
  });
};
