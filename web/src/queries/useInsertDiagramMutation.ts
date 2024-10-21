import { DiagramsControllerApi } from "@linz/survey-plan-generation-api-client";
import { InsertUserDefinedDiagramRequest } from "@linz/survey-plan-generation-api-client/src/apis/DiagramsControllerApi";
import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";

import { IFeatureSourceDiagram, sortByDiagramsByType } from "@/components/DefineDiagrams/featureMapper";
import { apiConfig } from "@/queries/apiConfig";
import { getOpenlayersDiagramsQueryKey } from "@/queries/diagrams";
import { useDiagramLabelsHook } from "@/queries/labels";
import { cartesianToNumeric } from "@/util/mapUtil";
import { byId, useQueryDataUpdate } from "@/util/queryUtil";
import { useShowToast } from "@/util/showToast";

/**
 * Insert diagram mutation.  Optimistic update with rollback on error.
 */
export const useInsertDiagramMutation = (transactionId: number) => {
  const diagramLabels = useDiagramLabelsHook(transactionId);
  const { appendQueryData, removeQueryData, updateQueryData } = useQueryDataUpdate<IFeatureSourceDiagram>({
    queryKey: getOpenlayersDiagramsQueryKey(transactionId),
    sortBy: sortByDiagramsByType,
  });
  const { showErrorToast } = useShowToast();

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
    mutationFn: (props: InsertUserDefinedDiagramRequest) => {
      return new DiagramsControllerApi(apiConfig() as never).insertUserDefinedDiagram(props);
    },
    onError: (error, _variables, match) => {
      console.error(error);
      match && removeQueryData({ match });
    },
    onSuccess: (response, _variables, match) => {
      if (!response.ok) {
        showErrorToast(response.message ?? "Unknown error");
        removeQueryData({ match });
        return;
      }
      if (response.diagramId == null) {
        showErrorToast("Unexpected null response for diagramId");
        removeQueryData({ match });
        return;
      }

      // Success
      updateQueryData({ match, withProps: { id: response.diagramId } });
      return diagramLabels.updateLabels();
    },
  });
};
