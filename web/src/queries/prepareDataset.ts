import { UseMutationResult, useMutation } from "@tanstack/react-query";
import { planGenApiConfig } from "@/redux/apiConfig";
import { DiagramsControllerApi, PostDiagramsResponseDTO } from "@linz/survey-plan-generation-api-client";

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

export const usePrepareDatasetMutation = (
  transactionId: number,
): UseMutationResult<PostDiagramsResponseDTO, Error | PrepareDatasetError, void> =>
  useMutation({
    mutationKey: ["prepareDataset", transactionId],
    mutationFn: async () => {
      const response = await new DiagramsControllerApi(planGenApiConfig()).postDiagrams({ transactionId });
      if (!response.ok) {
        throw new PrepareDatasetError(response.message ?? "Failed to prepare dataset", response.statusCode);
      }
      return response;
    },
  });
