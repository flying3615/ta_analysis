import { SurveyFeaturesControllerApi, SurveyFeaturesResponseDTO } from "@linz/survey-plan-generation-api-client";
import { QueryClient, useQuery } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";
import { PlanGenQuery } from "@/queries/types";

export const getSurveyFeaturesQueryKey = (transactionId: number) => ["surveyFeatures", transactionId];

export const useSurveyFeaturesQuery: PlanGenQuery<SurveyFeaturesResponseDTO> = ({ transactionId, enabled }) =>
  useQuery({
    queryKey: getSurveyFeaturesQueryKey(transactionId),
    queryFn: () => new SurveyFeaturesControllerApi(apiConfig()).getSurveyFeatures({ transactionId }),
    enabled,
  });

export const getSurveyFeaturesQueryData = (queryClient: QueryClient, transactionId: number) =>
  queryClient.getQueryData<SurveyFeaturesResponseDTO>(getSurveyFeaturesQueryKey(transactionId));
