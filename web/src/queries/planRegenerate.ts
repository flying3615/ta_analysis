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
      return await new PlanRegenerateControllerApi(apiConfig()).regeneratePlan({ transactionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getPlanQueryKey(transactionId) });
    },
  });
};
