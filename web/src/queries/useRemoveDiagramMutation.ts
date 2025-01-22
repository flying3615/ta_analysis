import { DiagramsControllerApi } from "@linz/survey-plan-generation-api-client";
import { DeleteUserDefinedDiagramsRequest } from "@linz/survey-plan-generation-api-client/src/apis/DiagramsControllerApi";
import { IFeatureSource } from "@linzjs/landonline-openlayers-map";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";
import { getOpenlayersDiagramsQueryKey } from "@/queries/diagrams";
import { getDiagramLabelsQueryKey } from "@/queries/labels";
import { byId, useQueryDataUpdate } from "@/util/queryUtil";

export const useRemoveDiagramMutation = (transactionId: number) => {
  const queryClient = useQueryClient();
  const { removeQueryData } = useQueryDataUpdate<IFeatureSource>({
    queryKey: getOpenlayersDiagramsQueryKey(transactionId),
  });

  return useMutation({
    mutationFn: async (props: DeleteUserDefinedDiagramsRequest) => {
      const response = await new DiagramsControllerApi(apiConfig()).deleteUserDefinedDiagrams(props);
      if (!response.ok) {
        throw Error(response.message || "unexpected error");
      }
    },
    onSuccess: async (_, props) => {
      await queryClient.invalidateQueries({ queryKey: getDiagramLabelsQueryKey(transactionId) });
      removeQueryData({ match: byId(props.deleteDiagramsRequestDTO.diagramIds) });
    },
  });
};
