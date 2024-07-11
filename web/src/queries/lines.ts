import { LinesControllerApi, LinesResponseDTO } from "@linz/survey-plan-generation-api-client";
import { useQuery } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";
import { PlanGenQuery } from "@/queries/types";

export const getLinesQueryKey = (transactionId: number) => ["lines", transactionId];

export const useGetLinesQuery: PlanGenQuery<LinesResponseDTO> = ({ transactionId, ...params }) =>
  useQuery({
    ...params,
    queryKey: getLinesQueryKey(transactionId),
    queryFn: () => new LinesControllerApi(apiConfig()).lines({ transactionId }),
  });
