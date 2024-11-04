import type {
  GetSurveyLabelPreferenceRequest,
  LabelPreferenceDefaultDTO,
  LabelPreferenceDTO,
  LabelPreferencesResponseDTOFontsInner,
} from "@linz/survey-plan-generation-api-client";
import { LabelPreferencesControllerApi } from "@linz/survey-plan-generation-api-client";
import type { UpdateLabelPreferenceRequestDTO } from "@linz/survey-plan-generation-api-client/src/models";
import { wait } from "@linzjs/step-ag-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";
import { usePrepareDatasetQuery } from "@/queries/prepareDataset";
import { withId } from "@/util/queryUtil";
import { useShowToast } from "@/util/showToast";

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

  const showError = () => showErrorToast("Update label preferences failed");

  return useMutation({
    mutationFn: async (updateLabelPreferenceRequestDTO: UpdateLabelPreferenceRequestDTO) => {
      await wait(2000);
      return await new LabelPreferencesControllerApi(apiConfig()).updateLabelPreference({
        transactionId,
        updateLabelPreferenceRequestDTO,
      });
    },
    onError: () => {
      showError();
      return { ok: false };
    },
    onSuccess: async ({ ok }) => {
      if (!ok) {
        showError();
      } else {
        await queryClient.invalidateQueries({ queryKey: userLabelPreferencesQueryKey(transactionId) });
      }
      return { ok };
    },
  });
};
