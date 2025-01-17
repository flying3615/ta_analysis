import type {
  DiagramLayerDefinitionPreferencesDTO,
  GetDiagramNamesResponseDTO,
  GetDiagramTypesResponseDTO,
} from "@linz/survey-plan-generation-api-client";
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
} from "@linz/survey-plan-generation-api-client";
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

export interface UpdateDiagramPreferencesMutationProps {
  diagramsByType: Array<DiagramLayerPreferenceDTO & { id: number }>;
}
/**
 * Update diagram preferences mutation.
 */
export const useUpdateLayerPreferencesByDiagramTypeMutation = (transactionId: number, diagramTypeCode: string) => {
  const queryClient = useQueryClient();
  const { showErrorToast } = useShowToast();
  const onError = () => showErrorToast("Error updating diagram layer preferences.");
  const onSuccess = () =>
    queryClient.invalidateQueries({
      queryKey: diagramLayerPreferencesByDiagramTypeQueryKey(transactionId, diagramTypeCode),
    });

  return useMutation({
    mutationFn: async (props: UpdateDiagramPreferencesMutationProps) => {
      const response = await new MaintainDiagramsControllerApi(apiConfig()).updateDiagramLayerPreferencesByDiagramType({
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
      if (!response.ok) throw new Error("Update failed");
      return response;
    },
    onError,
    onSuccess,
  });
};

export interface UpdateDiagramPreferencesByIdMutationProps {
  diagramsById: Array<DiagramLayerPreferenceDTO & { id: number }>;
}

export const useUpdateLayerPreferencesByDiagramIdMutation = (transactionId: number, diagramId: number) => {
  const queryClient = useQueryClient();
  const { showErrorToast } = useShowToast();
  const onError = () => showErrorToast("Error updating diagram layer preferences.");
  const onSuccess = () =>
    queryClient.invalidateQueries({
      queryKey: diagramLayerPreferencesByDiagramQueryKey(transactionId, diagramId),
    });

  return useMutation({
    mutationFn: async (props: UpdateDiagramPreferencesByIdMutationProps) => {
      const response = await new MaintainDiagramsControllerApi(apiConfig()).updateDiagramLayerPreferencesByDiagram({
        transactionId,
        diagramId,
        updateDiagramLayerPreferencesRequestDTO: {
          diagramLayerPreferences: props.diagramsById.map((r) => ({
            pldfId: r.pldfId,
            hideLabels: r.hideLabels,
            hideFeature: r.hideFeature,
            selected: r.selected,
          })),
        },
      });
      if (!response.ok) throw new Error("Update failed");
      return response;
    },
    onError,
    onSuccess,
  });
};
