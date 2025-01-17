import { CreateLineResponseDTO, LinesControllerApi } from "@linz/survey-plan-generation-api-client";
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

export class InsertAbuttalLineError extends Error {}

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
    mutationFn: async (props: CreateAbuttalLineRequest): Promise<CreateLineResponseDTO> => {
      const response = await new LinesControllerApi(apiConfig()).createAbuttalLine(props);
      if (!response.ok) {
        throw new InsertAbuttalLineError(response.message ?? "unknown reason");
      }
      return response;
    },
    onError: (_error, _variables, match) => {
      match && removeQueryData({ match });
    },
    onSuccess: async (_response, _variables) => {
      await queryClient.refetchQueries({ queryKey: getLinesQueryKey(transactionId) });
    },
  });
};
