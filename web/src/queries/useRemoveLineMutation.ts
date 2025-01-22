import { LinesControllerApi } from "@linz/survey-plan-generation-api-client";
import { DeleteLinesRequest } from "@linz/survey-plan-generation-api-client/src/apis/LinesControllerApi";
import { IFeatureSource } from "@linzjs/landonline-openlayers-map";
import { useMutation } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";
import { getLinesQueryKey } from "@/queries/lines";
import { byId, useQueryDataUpdate } from "@/util/queryUtil";

export const useRemoveLineMutation = (transactionId: number) => {
  const { removeQueryData } = useQueryDataUpdate<IFeatureSource>({ queryKey: getLinesQueryKey(transactionId) });

  return useMutation({
    mutationFn: async (props: DeleteLinesRequest) => {
      const response = await new LinesControllerApi(apiConfig()).deleteLines(props);
      if (!response.ok) {
        throw Error(response.message || "unexpected error");
      }
    },
    onSuccess: (_, props) => {
      removeQueryData({ match: byId(props.deleteLinesRequestDTO.lineIds) });
    },
  });
};
