import { PlanCheckControllerApi, PlanCheckResponseDTO } from "@linz/survey-plan-generation-api-client";
import { useQuery } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";
import { PlanGenQuery } from "@/queries/types";

export const planCheckQueryKey = (transactionId: number) => ["getPlanCheck", transactionId];

export const usePlanCheckQuery: PlanGenQuery<PlanCheckResponseDTO> = ({ transactionId }) =>
  useQuery({
    queryKey: planCheckQueryKey(transactionId),
    queryFn: () => new PlanCheckControllerApi(apiConfig()).planCheck({ transactionId }),
  });
