import { DiagramsControllerApi, DiagramsResponseDTO } from "@linz/survey-plan-generation-api-client";
import { InsertUserDefinedDiagramRequest } from "@linz/survey-plan-generation-api-client/src/apis/DiagramsControllerApi.ts";
import { useShowLUIMessage } from "@linzjs/lui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import {
  getDiagramsForOpenLayers,
  IFeatureSourceDiagram,
  sortDiagramsByType,
} from "@/components/DefineDiagrams/featureMapper.ts";
import { apiConfig } from "@/queries/apiConfig";
import { useDiagramLabelsHook } from "@/queries/labels.ts";
import { PlanGenQuery } from "@/queries/types";

export const getDiagramsQueryKey = (transactionId: number) => ["diagrams", transactionId];

export const useGetDiagramsQuery: PlanGenQuery<DiagramsResponseDTO> = ({ transactionId }) =>
  useQuery({
    queryKey: getDiagramsQueryKey(transactionId),
    queryFn: async () =>
      getDiagramsForOpenLayers(await new DiagramsControllerApi(apiConfig() as never).diagrams({ transactionId })),
  });

/**
 * Insert diagram mutation.  Optimistic update with rollback on error.
 */
export const useInsertDiagramMutation = (transactionId: number) => {
  const queryClient = useQueryClient();
  const diagramLabels = useDiagramLabelsHook(transactionId);
  const queryKey = getDiagramsQueryKey(transactionId);
  const showMessage = useShowLUIMessage();

  const tempDiagramIdRef = useRef(-1);
  const removeTempItem = (tempDiagram: IFeatureSourceDiagram | undefined) => {
    queryClient.setQueryData<IFeatureSourceDiagram[]>(queryKey, (list) =>
      list ? list.filter((item) => item !== tempDiagram) : [],
    );
  };

  return useMutation({
    onMutate: (props: InsertUserDefinedDiagramRequest) => {
      const tempDiagramId = tempDiagramIdRef.current--;
      const newData: IFeatureSourceDiagram = {
        id: tempDiagramId,
        diagramType: props.postDiagramsRequestDTO.diagramType,
        shape: {
          geometry: {
            coordinates: [props.postDiagramsRequestDTO.coordinates.map(({ x, y }) => [x, y])],
            type: "Polygon",
          },
        },
      };

      queryClient.setQueryData<IFeatureSourceDiagram[]>(queryKey, (list) =>
        [...(list ?? []), newData].sort(sortDiagramsByType),
      );

      return newData;
    },
    mutationFn: (props: InsertUserDefinedDiagramRequest) =>
      new DiagramsControllerApi(apiConfig() as never).insertUserDefinedDiagram(props),
    onError: (_error, _variables, tempDiagram: IFeatureSourceDiagram | undefined) => removeTempItem(tempDiagram),
    onSuccess: (response, _variables, tempDiagram: IFeatureSourceDiagram) => {
      if (!response.ok) {
        showMessage({ messageLevel: "error", messageType: "toast", message: response.message ?? "Unknown error" });
        removeTempItem(tempDiagram);
        return;
      }
      if (response.diagramId == null) {
        // Theoretically cannot happen
        showMessage({ messageLevel: "error", messageType: "toast", message: "Unexpected null response for diagramId" });
        removeTempItem(tempDiagram);
        return;
      }

      // Update temp diagrams Id
      queryClient.setQueryData<IFeatureSourceDiagram[]>(queryKey, (list) => {
        if (!list) return [];
        return list.map((item) =>
          item === tempDiagram
            ? {
                ...tempDiagram,
                id: response.diagramId,
              }
            : item,
        );
      });
      diagramLabels.updateLabels();
    },
  });
};
