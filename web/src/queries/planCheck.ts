import { PlanCheckControllerApi, PlanCheckResponseDTO } from "@linz/survey-plan-generation-api-client";
import { useQuery } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";
import { PlanGenQuery } from "@/queries/types";

export const planCheckQueryKey = (transactionId: number) => ["getPlanCheck", transactionId];

export const usePlanCheckQuery: PlanGenQuery<PlanCheckResponseDTO> = ({ transactionId, ...params }) =>
  useQuery({
    ...params,
    queryKey: planCheckQueryKey(transactionId),
    queryFn: async () => {
      const res = await new PlanCheckControllerApi(apiConfig()).planCheck({ transactionId });
      return res;
    },
  });
