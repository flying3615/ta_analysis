import { DiagramsControllerApi, DiagramsResponseDTO } from "@linz/survey-plan-generation-api-client";
import { InsertUserDefinedDiagramRequest } from "@linz/survey-plan-generation-api-client/src/apis/DiagramsControllerApi.ts";
import { useShowLUIMessage } from "@linzjs/lui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef } from "react";

import {
  getDiagramsForOpenLayers,
  IFeatureSourceDiagram,
  sortByDiagramsByType,
} from "@/components/DefineDiagrams/featureMapper.ts";
import { apiConfig } from "@/queries/apiConfig";
import { useDiagramLabelsHook } from "@/queries/labels.ts";
import { PlanGenQuery } from "@/queries/types";
import { useQueryDataUpdate } from "@/util/queryUtil.ts";

export const userDefinedDiagramTypes = ["UDFP", "UDFT", "UDFN"];

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
  const diagramLabels = useDiagramLabelsHook(transactionId);
  const { appendQueryData, removeQueryData, updateQueryData } = useQueryDataUpdate<IFeatureSourceDiagram>({
    queryKey: getDiagramsQueryKey(transactionId),
    sortBy: sortByDiagramsByType,
  });
  const showMessage = useShowLUIMessage();

  const tempDiagramIdRef = useRef(-1);

  return useMutation({
    onMutate: (props: InsertUserDefinedDiagramRequest) => {
      const newData: IFeatureSourceDiagram = {
        id: tempDiagramIdRef.current--,
        diagramType: props.postDiagramsRequestDTO.diagramType,
        shape: {
          geometry: {
            coordinates: [props.postDiagramsRequestDTO.coordinates.map(({ x, y }) => [x, y])],
            type: "Polygon",
          },
        },
      };

      appendQueryData({ newItem: newData });
      return newData;
    },
    mutationFn: (props: InsertUserDefinedDiagramRequest) => {
      return new DiagramsControllerApi(apiConfig() as never).insertUserDefinedDiagram(props);
    },
    onError: (_error, _variables, tempDiagram: IFeatureSourceDiagram | undefined) => {
      tempDiagram && removeQueryData({ remove: tempDiagram });
    },
    onSuccess: (response, _variables, tempDiagram: IFeatureSourceDiagram) => {
      if (!response.ok) {
        showMessage({ messageLevel: "error", messageType: "toast", message: response.message ?? "Unknown error" });
        removeQueryData({ remove: tempDiagram });
      } else if (response.diagramId == null) {
        showMessage({ messageLevel: "error", messageType: "toast", message: "Unexpected null response for diagramId" });
        removeQueryData({ remove: tempDiagram });
      } else {
        // Success
        updateQueryData({ updateItem: tempDiagram, withProps: { id: response.diagramId } });
        diagramLabels.updateLabels();
      }
    },
  });
};
