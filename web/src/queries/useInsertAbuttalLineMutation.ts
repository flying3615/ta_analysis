import { LinesControllerApi } from "@linz/survey-plan-generation-api-client";
import {
  CreateAbuttalLineRequest,
  LinesResponseDTOLinesInnerSymbolTypeEnum,
} from "@linz/survey-plan-generation-api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { IFeatureSourceLine } from "@/components/DefineDiagrams/featureMapper";
import { apiConfig } from "@/queries/apiConfig";
import { getLinesQueryKey } from "@/queries/lines";
import { cartesianToNumeric } from "@/util/mapUtil";
import { byId, useQueryDataUpdate } from "@/util/queryUtil";

/**
 * Insert diagram mutation.  Optimistic update with rollback on error.
 */
export const useInsertAbuttalLineMutation = (transactionId: number) => {
  const queryClient = useQueryClient();
  const { appendQueryData, removeQueryData } = useQueryDataUpdate<IFeatureSourceLine>({
    queryKey: getLinesQueryKey(transactionId),
  });

  const tempDiagramIdRef = useRef(-1);

  return useMutation({
    onMutate: (props: CreateAbuttalLineRequest) => {
      const id = tempDiagramIdRef.current--;
      const tempLine: IFeatureSourceLine = {
        id,
        symbolType: LinesResponseDTOLinesInnerSymbolTypeEnum.ABB,
        shape: {
          geometry: {
            type: "LineString",
            coordinates: props.createLineRequestDTO.coordinates.map(cartesianToNumeric),
          },
        },
      };

      appendQueryData({ newItem: tempLine });
      return byId(id);
    },
    mutationFn: async (props: CreateAbuttalLineRequest): Promise<void> => {
      const response = await new LinesControllerApi(apiConfig()).createAbuttalLine(props);
      if (!response.ok) {
        throw Error(response.message || "unexpected error");
      }
    },
    onError: (_error, _variables, match) => {
      match && removeQueryData({ match });
    },
    onSuccess: async (_, _variables) => {
      await queryClient.refetchQueries({ queryKey: getLinesQueryKey(transactionId) });
    },
  });
};
