import { PostPrepareResponseDTO, PrepareControllerApi } from "@linz/survey-plan-generation-api-client";
import { useMutation } from "@tanstack/react-query";

import { queryClient } from "@/queries";
import { apiConfig } from "@/queries/apiConfig";
import { PlanGenMutation } from "@/queries/types";

import { getDiagramsQueryKey } from "./diagrams";
import { getSurveyFeaturesQueryKey } from "./surveyFeatures";

/**
 * Error that occurs when the survey is in a non-ready state to be edited in plangen.
 * This is not a HTTP status error, but an error with the survey itself.
 */
export class PrepareDatasetError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
  }
}

export const getPrepareDatasetQueryKey = (transactionId: number) => ["prepareDataset", transactionId];

export const usePrepareDatasetMutation: PlanGenMutation<PostPrepareResponseDTO> = ({ transactionId, ...params }) =>
  useMutation({
    ...params,
    mutationKey: getPrepareDatasetQueryKey(transactionId),
    mutationFn: async () => {
      const response = await new PrepareControllerApi(apiConfig()).postPrepare({ transactionId });
      if (!response.ok) {
        throw new PrepareDatasetError(response.message ?? "Failed to prepare dataset", response.statusCode);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getSurveyFeaturesQueryKey(transactionId) });
      queryClient.invalidateQueries({ queryKey: getDiagramsQueryKey(transactionId) });
    },
  });
