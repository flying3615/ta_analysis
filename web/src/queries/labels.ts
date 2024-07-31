import { DiagramLabelsControllerApi } from "@linz/survey-plan-generation-api-client";
import { useQueryClient } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig.ts";

export const getLabelsQueryKey = (transactionId: number) => ["labels", transactionId];
export interface DiagramLabelsHook {
  updateLabels: () => void;
}
export const useDiagramLabelsHook = (transactionId: number): DiagramLabelsHook => {
  const queryClient = useQueryClient();
  const updateLabels = async (): Promise<void> => {
    await new DiagramLabelsControllerApi(apiConfig() as never).updateDiagramLabels({ transactionId });
    await queryClient.invalidateQueries({ queryKey: getLabelsQueryKey(transactionId) });
  };
  return { updateLabels };
};
