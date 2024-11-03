import {
  DiagramLayerPreferenceDTO,
  DiagramLayerPreferencesDTO,
  GetDiagramLayerPreferencesByDiagramRequest,
  MaintainDiagramsControllerApi,
} from "@linz/survey-plan-generation-api-client";
import {
  GetDiagramLayerPreferencesByDiagramTypeRequest,
  GetDiagramNamesRequest,
  GetDiagramTypesRequest,
} from "@linz/survey-plan-generation-api-client/src/apis/MaintainDiagramsControllerApi";
import type {
  DiagramLayerDefinitionPreferencesDTO,
  GetDiagramNamesResponseDTO,
  GetDiagramTypesResponseDTO,
} from "@linz/survey-plan-generation-api-client/src/models";
import { useMutation, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";
import { useShowToast } from "@/util/showToast";

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
    refetchOnMount: true,
  });

export interface UpdateDiagramPreferencesProps {
  transactionId: number;
  diagramTypeCode: string;
}
export interface UpdateDiagramPreferencesMutationProps {
  diagramsByType: Array<DiagramLayerPreferenceDTO & { id: number }>;
}
/**
 * Update diagram preferences mutation.
 */
export const useUpdateLayerPreferencesByDiagramTypeMutation = ({
  transactionId,
  diagramTypeCode,
}: UpdateDiagramPreferencesProps) => {
  const queryClient = useQueryClient();
  const { showErrorToast } = useShowToast();

  return useMutation({
    mutationFn: (props: UpdateDiagramPreferencesMutationProps) => {
      return new MaintainDiagramsControllerApi(apiConfig()).updateDiagramLayerPreferencesByDiagramType({
        transactionId,
        diagramTypeCode,
        updateDiagramLayerPreferencesRequestDTO: {
          diagramLayerPreferences: props.diagramsByType.map((r) => ({
            pldfId: r.pldfId,
            hideLabels: r.hideLabels,
            hideFeature: r.hideFeature,
            selected: r.selected,
          })),
        },
      });
    },
    onError: () => {
      showErrorToast("Error updating diagram layer preferences");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: diagramLayerPreferencesByDiagramTypeQueryKey(transactionId, diagramTypeCode),
      });
    },
  });
};
