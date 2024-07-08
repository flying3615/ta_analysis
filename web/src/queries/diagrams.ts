import { DiagramsControllerApi, DiagramsResponseDTO } from "@linz/survey-plan-generation-api-client";
import { useQuery } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";
import { PlanGenQuery } from "@/queries/types";

export const getDiagramsQueryKey = (transactionId: number) => ["diagrams", transactionId];

export const useGetDiagramsQuery: PlanGenQuery<DiagramsResponseDTO> = ({ transactionId, ...params }) =>
  useQuery({
    ...params,
    queryKey: getDiagramsQueryKey(transactionId),
    queryFn: () => new DiagramsControllerApi(apiConfig()).diagrams({ transactionId }),
  });
