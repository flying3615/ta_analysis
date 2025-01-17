import type {
  GetSurveyLabelPreferenceRequest,
  LabelPreferenceDefaultDTO,
  LabelPreferenceDTO,
  LabelPreferencesResponseDTOFontsInner,
} from "@linz/survey-plan-generation-api-client";
import type { UpdateLabelPreferenceRequestDTO } from "@linz/survey-plan-generation-api-client";
import { LabelPreferencesControllerApi } from "@linz/survey-plan-generation-api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";
import { usePrepareDatasetQuery } from "@/queries/prepareDataset";
import { withId } from "@/util/queryUtil";
import { useShowToast } from "@/util/showToast";

const IS_HIDDEN_OBJECTS_VISIBLE_STORAGE_KEY = "plangen.isHiddenObjectsVisibleByDefault";

export const isHiddenObjectsVisibleByDefault = (): boolean => {
  return localStorage.getItem(IS_HIDDEN_OBJECTS_VISIBLE_STORAGE_KEY) !== "false";
};

export const setHiddenObjectsVisibleByDefault = (isHiddenObjectsVisibleByDefault?: boolean) => {
  if (isHiddenObjectsVisibleByDefault === undefined) {
    localStorage.removeItem(IS_HIDDEN_OBJECTS_VISIBLE_STORAGE_KEY);
    return;
  }
  localStorage.setItem(IS_HIDDEN_OBJECTS_VISIBLE_STORAGE_KEY, isHiddenObjectsVisibleByDefault ? "true" : "false");
};

export interface LabelPreferenceDefaultDTOWithId extends LabelPreferenceDefaultDTO {
  id: string;
}

export interface LabelPreferenceDTOWithId extends LabelPreferenceDTO {
  id: string;
}

export interface LabelPreferencesDTOWithId {
  fonts: Array<LabelPreferencesResponseDTOFontsInner>;
  defaults: Array<LabelPreferenceDefaultDTOWithId>;
  surveyLabelPreferences: Array<LabelPreferenceDTOWithId>;
  userLabelPreferences: Array<LabelPreferenceDTOWithId>;
}

export const userLabelPreferencesQueryKey = (transactionId: number) => ["userLabelPreferences", transactionId];

export const useUserLabelPreferences = ({ transactionId }: GetSurveyLabelPreferenceRequest) => {
  const { data, isSuccess, isLoading } = usePrepareDatasetQuery({ transactionId });

  return useQuery({
    queryKey: userLabelPreferencesQueryKey(transactionId),
    queryFn: async () => {
      const r = await new LabelPreferencesControllerApi(apiConfig()).getSurveyLabelPreference({
        transactionId,
      });

      return {
        fonts: r.fonts,
        defaults: withId(r.defaults, "labelType"),
        surveyLabelPreferences: withId(r.surveyLabelPreferences, "labelType"),
        userLabelPreferences: withId(r.userLabelPreferences, "labelType"),
      } as LabelPreferencesDTOWithId;
    },
    enabled: data && isSuccess && !isLoading,
    refetchOnMount: true,
  });
};

export const useUpdateLabelPreferencesMutation = (transactionId: number) => {
  const queryClient = useQueryClient();
  const { showErrorToast } = useShowToast();

  const onError = () => showErrorToast("Update label preferences failed");
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: userLabelPreferencesQueryKey(transactionId) });

  return useMutation({
    mutationFn: async (updateLabelPreferenceRequestDTO: UpdateLabelPreferenceRequestDTO) => {
      const response = await new LabelPreferencesControllerApi(apiConfig()).updateLabelPreference({
        transactionId,
        updateLabelPreferenceRequestDTO,
      });
      if (!response.ok) throw new Error("Update failed");
      return response;
    },
    onError,
    onSuccess,
  });
};
