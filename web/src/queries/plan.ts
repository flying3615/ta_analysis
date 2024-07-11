import { PlanControllerApi, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { useQuery } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";
import { PlanGenQuery } from "@/queries/types";

export const getPlanQueryKey = (transactionId: number) => ["getPlan", transactionId];

export const useGetPlanQuery: PlanGenQuery<PlanResponseDTO> = ({ transactionId, ...params }) =>
  useQuery({
    ...params,
    queryKey: getPlanQueryKey(transactionId),
    queryFn: () => new PlanControllerApi(apiConfig()).getPlan({ transactionId }),
  });
