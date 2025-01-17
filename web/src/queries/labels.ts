import { DiagramLabelsControllerApi } from "@linz/survey-plan-generation-api-client";
import { useQueryClient } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";

export const getDiagramLabelsQueryKey = (transactionId: number) => ["labels", transactionId];
export interface DiagramLabelsHook {
  updateLabels: () => Promise<void>;
}
export const useDiagramLabelsHook = (transactionId: number): DiagramLabelsHook => {
  const queryClient = useQueryClient();
  const updateLabels = async (): Promise<void> => {
    await new DiagramLabelsControllerApi(apiConfig()).updateDiagramLabels({ transactionId });
    await queryClient.invalidateQueries({ queryKey: getDiagramLabelsQueryKey(transactionId) });
  };
  return { updateLabels };
};
