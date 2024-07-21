import { PlanControllerApi, RegeneratePlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { useMutation } from "@tanstack/react-query";

import { queryClient } from "@/queries";
import { apiConfig } from "@/queries/apiConfig";
import { getPlanQueryKey } from "@/queries/plan.ts";
import { PrepareDatasetError } from "@/queries/prepareDataset.ts";
import { PlanGenMutation } from "@/queries/types";

export const regeneratePlanQueryKey = (transactionId: number) => ["regeneratePlan", transactionId];

export const useRegeneratePlanMutation: PlanGenMutation<RegeneratePlanResponseDTO> = ({ transactionId, ...params }) =>
  useMutation({
    ...params,
    mutationKey: regeneratePlanQueryKey(transactionId),
    mutationFn: async () => {
      const regenerateResponse = await new PlanControllerApi(apiConfig()).regeneratePlan({ transactionId });

      if (regenerateResponse.ok) return regenerateResponse;

      throw new PrepareDatasetError(
        regenerateResponse.message ?? "Failed to prepare dataset",
        regenerateResponse.statusCode,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getPlanQueryKey(transactionId) });
    },
  });
