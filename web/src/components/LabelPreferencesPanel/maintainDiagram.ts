import {
  DiagramLayerPreferencesDTO,
  GetDiagramLayerPreferencesByDiagramRequest,
  MaintainDiagramsControllerApi,
} from "@linz/survey-plan-generation-api-client";
import {
  GetDiagramLayerPreferencesByDiagramTypeRequest,
  GetDiagramNamesRequest,
  GetDiagramTypesRequest,
} from "@linz/survey-plan-generation-api-client/src/apis/MaintainDiagramsControllerApi.ts";
import type {
  DiagramLayerDefinitionPreferencesDTO,
  GetDiagramNamesResponseDTO,
  GetDiagramTypesResponseDTO,
} from "@linz/survey-plan-generation-api-client/src/models";
import { useQuery, UseQueryResult } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig.ts";

export const diagramNamesQueryKey = (transactionId: number) => ["diagramNames", transactionId];

export const useDiagramNamesQuery = ({
  transactionId,
}: GetDiagramNamesRequest): UseQueryResult<GetDiagramNamesResponseDTO> =>
  useQuery({
    queryKey: diagramNamesQueryKey(transactionId),
    queryFn: () =>
      new MaintainDiagramsControllerApi(apiConfig()).getDiagramNames({
        transactionId,
      }),
  });

export const diagramTypesQueryKey = (transactionId: number) => ["diagramTypes", transactionId];

export const useDiagramTypesQuery = ({
  transactionId,
}: GetDiagramTypesRequest): UseQueryResult<GetDiagramTypesResponseDTO> =>
  useQuery({
    queryKey: diagramTypesQueryKey(transactionId),
    queryFn: () =>
      new MaintainDiagramsControllerApi(apiConfig()).getDiagramTypes({
        transactionId,
      }),
  });

export const allDiagramLayerPreferencesQueryKey = (transactionId: number) => ["diagramLayerPreferences", transactionId];

export const diagramLayerPreferencesByDiagramQueryKey = (transactionId: number, diagramId: number) => [
  ...allDiagramLayerPreferencesQueryKey(transactionId),
  "diagramId",
  diagramId,
];

export const useDiagramLayerPreferencesByDiagramQuery = (
  { transactionId, diagramId }: GetDiagramLayerPreferencesByDiagramRequest,
  options: { enabled: boolean },
): UseQueryResult<DiagramLayerPreferencesDTO> =>
  useQuery({
    queryKey: diagramLayerPreferencesByDiagramQueryKey(transactionId, diagramId),
    queryFn: () =>
      new MaintainDiagramsControllerApi(apiConfig()).getDiagramLayerPreferencesByDiagram({
        transactionId,
        diagramId,
      }),
    enabled: options.enabled,
  });

export const diagramLayerPreferencesByDiagramTypeQueryKey = (transactionId: number, diagramTypeCode: string) => [
  ...allDiagramLayerPreferencesQueryKey(transactionId),
  "diagramTypeCode",
  diagramTypeCode,
];

export const useDiagramLayerPreferencesByDiagramTypeQuery = (
  { transactionId, diagramTypeCode }: GetDiagramLayerPreferencesByDiagramTypeRequest,
  options: { enabled: boolean },
): UseQueryResult<DiagramLayerDefinitionPreferencesDTO> =>
  useQuery({
    queryKey: diagramLayerPreferencesByDiagramTypeQueryKey(transactionId, diagramTypeCode),
    queryFn: () =>
      new MaintainDiagramsControllerApi(apiConfig()).getDiagramLayerPreferencesByDiagramType({
        transactionId,
        diagramTypeCode,
      }),
    enabled: options.enabled,
  });
