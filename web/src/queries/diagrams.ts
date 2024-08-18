import { DiagramsControllerApi, DiagramsResponseDTO } from "@linz/survey-plan-generation-api-client";
import { QueryClient, useQuery } from "@tanstack/react-query";

import { getDiagramsForOpenLayers, IFeatureSourceDiagram } from "@/components/DefineDiagrams/featureMapper.ts";
import { apiConfig } from "@/queries/apiConfig";
import { PlanGenQuery } from "@/queries/types";

export const userDefinedDiagramTypes = ["UDFP", "UDFT", "UDFN"];

export const getDiagramsQueryKey = (transactionId: number) => ["diagrams", transactionId];

export const useGetDiagramsQuery: PlanGenQuery<IFeatureSourceDiagram[]> = ({ transactionId }) =>
  useQuery({
    queryKey: getDiagramsQueryKey(transactionId),
    queryFn: async () =>
      getDiagramsForOpenLayers(await new DiagramsControllerApi(apiConfig() as never).diagrams({ transactionId })),
  });

export const useGetDiagramsQueryOLD: PlanGenQuery<DiagramsResponseDTO> = ({ transactionId, ...params }) =>
  useQuery({
    ...params,
    queryKey: getDiagramsQueryKey(transactionId),
    queryFn: () => new DiagramsControllerApi(apiConfig()).diagrams({ transactionId }),
  });

export const getQueryDiagram = (
  queryClient: QueryClient,
  transactionId: number,
  diagramId: number,
): IFeatureSourceDiagram | undefined =>
  queryClient
    .getQueryData<IFeatureSourceDiagram[]>(getDiagramsQueryKey(transactionId))
    ?.filter((diagram) => diagram.id === diagramId)[0];
