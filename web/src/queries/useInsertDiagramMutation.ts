import { DiagramsControllerApi } from "@linz/survey-plan-generation-api-client";
import { InsertUserDefinedDiagramRequest } from "@linz/survey-plan-generation-api-client";
import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";

import { IFeatureSourceDiagram, sortByDiagramsByType } from "@/components/DefineDiagrams/featureMapper";
import { apiConfig } from "@/queries/apiConfig";
import { getOpenlayersDiagramsQueryKey } from "@/queries/diagrams";
import { useDiagramLabelsHook } from "@/queries/labels";
import { cartesianToNumeric } from "@/util/mapUtil";
import { byId, useQueryDataUpdate } from "@/util/queryUtil";

export class InsertDiagramError extends Error {}

/**
 * Insert diagram mutation.  Optimistic update with rollback on error.
 */
export const useInsertDiagramMutation = (transactionId: number) => {
  const diagramLabels = useDiagramLabelsHook(transactionId);
  const { appendQueryData, removeQueryData, updateQueryData } = useQueryDataUpdate<IFeatureSourceDiagram>({
    queryKey: getOpenlayersDiagramsQueryKey(transactionId),
    sortBy: sortByDiagramsByType,
  });

  const tempDiagramIdRef = useRef(-1);

  return useMutation({
    onMutate: (props: InsertUserDefinedDiagramRequest) => {
      const id = tempDiagramIdRef.current--;
      const tempDiagram: IFeatureSourceDiagram = {
        id,
        diagramType: props.postDiagramsRequestDTO.diagramType,
        shape: {
          geometry: {
            type: "Polygon",
            coordinates: [props.postDiagramsRequestDTO.coordinates.map(cartesianToNumeric)],
          },
        },
      };

      appendQueryData({ newItem: tempDiagram });
      return byId(id);
    },
    mutationFn: async (props: InsertUserDefinedDiagramRequest) => {
      const response = await new DiagramsControllerApi(apiConfig() as never).insertUserDefinedDiagram(props);
      if (!response.ok) {
        throw new InsertDiagramError(response.message ?? "Unknown error");
      }
      if (response.diagramId == null) {
        throw new InsertDiagramError("Unexpected null response for diagramId");
      }
      return response;
    },
    onError: (_error, _variables, match) => {
      match && removeQueryData({ match });
    },
    onSuccess: (response, _variables, match) => {
      // Success
      updateQueryData({ match, withProps: { id: response.diagramId } });
      return diagramLabels.updateLabels();
    },
  });
};
