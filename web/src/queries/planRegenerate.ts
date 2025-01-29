import { PlanRegenerateControllerApi, RegenerationStatusDTO } from "@linz/survey-plan-generation-api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";
import { getPlanQueryKey } from "@/queries/plan";

export const regeneratePlanQueryKey = (transactionId: number) => ["regeneratePlan", transactionId];

export const useRegeneratePlanMutation = (transactionId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: regeneratePlanQueryKey(transactionId),
    mutationFn: async () => {
      const response = await new PlanRegenerateControllerApi(apiConfig()).regeneratePlanRaw({ transactionId });
      if ((await response.raw.clone().text()).length === 0) {
        // Don't parse the response if it's empty
        return null;
      }
      return response.value();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getPlanQueryKey(transactionId) }),
  });
};

export const planRegenerationStatusQueryKey = (transactionId: number) => ["plan-regeneration-status", transactionId];

export const fetchPlanRegenerationStatus = async (
  transactionId: number,
  onRegenRequired: () => void,
): Promise<RegenerationStatusDTO> => {
  const planRegenStatus = await new PlanRegenerateControllerApi(apiConfig()).planRegenerationStatus({ transactionId });
  if (planRegenStatus.isRegenRequired) {
    onRegenRequired();
  }
  return planRegenStatus;
};

export const usePlanRegenerationStatusMutation = (transactionId: number, onRegenRequired: () => void) => {
  return useMutation({
    mutationKey: planRegenerationStatusQueryKey(transactionId),
    mutationFn: () => fetchPlanRegenerationStatus(transactionId, onRegenRequired),
  });
};
