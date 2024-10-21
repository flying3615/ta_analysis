import type {
  GetSurveyLabelPreferenceRequest,
  LabelPreferenceDTO,
  LabelPreferencesResponseDTO,
  LabelPreferencesResponseDTOFontsInner,
} from "@linz/survey-plan-generation-api-client";
import { LabelPreferencesControllerApi } from "@linz/survey-plan-generation-api-client";
import { useQuery } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";
import { usePrepareDatasetQuery } from "@/queries/prepareDataset";

export interface LabelPreferenceDTOWithId extends LabelPreferenceDTO {
  id: string;
}

export interface LabelPreferencesDTOWithId extends LabelPreferencesResponseDTO {
  fonts: Array<LabelPreferencesResponseDTOFontsInner>;
  defaults: Array<LabelPreferenceDTO>;
  surveyLabelPreferences: Array<LabelPreferenceDTOWithId>;
  userLabelPreferences: Array<LabelPreferenceDTOWithId>;
}

export const userLabelPreferencesQueryKey = (transactionId: number) => ["userLabelPreferences", transactionId];

export const useUserLabelPreferences = ({ transactionId }: GetSurveyLabelPreferenceRequest) => {
  return useQuery({
    queryKey: userLabelPreferencesQueryKey(transactionId),
    queryFn: async () => {
      const r = (await new LabelPreferencesControllerApi(apiConfig()).getSurveyLabelPreference({
        transactionId,
      })) as LabelPreferencesDTOWithId;
      r.userLabelPreferences.forEach((u) => (u.id = u.labelType));
      r.surveyLabelPreferences.forEach((u) => (u.id = u.labelType));
      return r;
    },
    enabled: usePrepareDatasetQuery({ transactionId }).isSuccess,
  });
};
