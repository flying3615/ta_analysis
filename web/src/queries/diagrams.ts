import { DiagramsControllerApi, DiagramsResponseDTO } from "@linz/survey-plan-generation-api-client";
import { InsertUserDefinedDiagramRequest } from "@linz/survey-plan-generation-api-client/src/apis/DiagramsControllerApi.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { getDiagramsForOpenLayers, IFeatureSourceDiagram } from "@/components/DefineDiagrams/featureMapper.ts";
import { apiConfig } from "@/queries/apiConfig";
import { PlanGenQuery } from "@/queries/types";

export const getDiagramsQueryKey = (transactionId: number) => ["diagrams", transactionId];

export const useGetDiagramsQuery: PlanGenQuery<DiagramsResponseDTO> = ({ transactionId }) =>
  useQuery({
    queryKey: getDiagramsQueryKey(transactionId),
    queryFn: async () =>
      getDiagramsForOpenLayers(await new DiagramsControllerApi(apiConfig() as never).diagrams({ transactionId })),
  });

export const insertDiagram = async (props: InsertUserDefinedDiagramRequest): Promise<number> => {
  const response = await new DiagramsControllerApi(apiConfig() as never).insertUserDefinedDiagram(props);
  return response.diagramId;
};

/**
 * Insert diagram mutation.  Optimistic update with rollback on error.
 */
export const useInsertDiagramMutation = (transactionId: number) => {
  const queryClient = useQueryClient();
  const queryKey = getDiagramsQueryKey(transactionId);

  const tempDiagramIdRef = useRef(-1);
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

      queryClient.setQueryData<IFeatureSourceDiagram[]>(queryKey, (list) => [...(list ?? []), newData]);

      return newData;
    },
    mutationFn: async (props: InsertUserDefinedDiagramRequest) => {
      return await insertDiagram(props);
    },
    onError: (error, variables, tempDiagram: IFeatureSourceDiagram | undefined) => {
      if (!tempDiagram) return;

      // Remove temp diagram on failure
      queryClient.setQueryData<IFeatureSourceDiagram[]>(queryKey, (list) =>
        list ? list.filter((item) => item !== tempDiagram) : [],
      );
    },
    onSuccess: (newDiagramId, variables, tempDiagram: IFeatureSourceDiagram) => {
      // Update temp diagrams Id
      queryClient.setQueryData<IFeatureSourceDiagram[]>(queryKey, (list) => {
        if (!list) return [];
        return list.map((item) =>
          item === tempDiagram
            ? {
                ...tempDiagram,
                id: newDiagramId,
              }
            : item,
        );
      });
    },
  });
};
