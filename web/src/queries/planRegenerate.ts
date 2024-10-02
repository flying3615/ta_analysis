import { PlanRegenerateControllerApi } from "@linz/survey-plan-generation-api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";
import { getPlanQueryKey } from "@/queries/plan.ts";

export const regeneratePlanQueryKey = (transactionId: number) => ["regeneratePlan", transactionId];

export const useRegeneratePlanMutation = (transactionId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: regeneratePlanQueryKey(transactionId),
    mutationFn: async () => {
      const response = await new PlanRegenerateControllerApi(apiConfig()).regeneratePlanRaw({ transactionId });
      if (response.raw.status === 200) {
        // If the response code is 200, the response body will be empty
        return null;
      }
      // Otherwise response code will be 202 which will have a body
      return await response.value();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getPlanQueryKey(transactionId) });
    },
  });
};
