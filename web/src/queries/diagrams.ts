import {
  DiagramsCheckControllerApi,
  DiagramsControllerApi,
  DiagramsResponseDTO,
  DiagramValidationResponseDTO,
} from "@linz/survey-plan-generation-api-client";
import { QueryClient, useQuery } from "@tanstack/react-query";

import { IFeatureSourceDiagram } from "@/components/DefineDiagrams/featureMapper";
import { apiConfig } from "@/queries/apiConfig";
import { PlanGenQuery } from "@/queries/types";

import { usePrepareDatasetQuery } from "./prepareDataset";

export const userDefinedDiagramTypes = ["UDFP", "UDFT", "UDFN"];

export const getDiagramsQueryKey = (transactionId: number) => ["diagrams", transactionId];
export const getDiagramCheckQueryKey = (transactionId: number) => ["diagramCheck", transactionId];
export const getOpenlayersDiagramsQueryKey = (transactionId: number) => ["openlayersDiagrams", transactionId];

export const useCheckDiagramsQuery: PlanGenQuery<DiagramValidationResponseDTO> = ({ transactionId }) => {
  return useQuery({
    queryKey: getDiagramCheckQueryKey(transactionId),
    queryFn: () => new DiagramsCheckControllerApi(apiConfig()).getDiagramValidationResults({ transactionId }),
    enabled: usePrepareDatasetQuery({ transactionId }).isSuccess,
  });
};

export const useGetDiagramsQuery: PlanGenQuery<DiagramsResponseDTO> = ({ transactionId, ...params }) =>
  useQuery({
    ...params,
    queryKey: getDiagramsQueryKey(transactionId),
    queryFn: () => new DiagramsControllerApi(apiConfig()).diagrams({ transactionId }),
  });

// This gets the `diagrams` from the response and filters by `id`
export const getOpenlayersQueryDiagram = (
  queryClient: QueryClient,
  transactionId: number,
  diagramId: number,
): IFeatureSourceDiagram | undefined =>
  queryClient
    .getQueryData<IFeatureSourceDiagram[]>(getOpenlayersDiagramsQueryKey(transactionId))
    ?.filter((diagram) => diagram.id === diagramId)[0];
