import { LabelsControllerApi, LabelsResponseDTO } from "@linz/survey-plan-generation-api-client";
import { useQuery } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig.ts";
import { PlanGenQuery } from "@/queries/types.ts";

export const getLabelsQueryKey = (transactionId: number) => ["labels", transactionId];

export const useGetLabelsQuery: PlanGenQuery<LabelsResponseDTO> = ({ transactionId, enabled }) =>
  useQuery({
    queryKey: getLabelsQueryKey(transactionId),
    queryFn: () => new LabelsControllerApi(apiConfig()).labels({ transactionId }),
    enabled,
  });
