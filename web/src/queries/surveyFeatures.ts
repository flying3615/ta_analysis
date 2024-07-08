import { SurveyFeaturesControllerApi, SurveyFeaturesResponseDTO } from "@linz/survey-plan-generation-api-client";
import { useQuery } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";
import { PlanGenQuery } from "@/queries/types";

export const getSurveyFeaturesQueryKey = (transactionId: number) => ["surveyFeatures", transactionId];

export const useSurveyFeaturesQuery: PlanGenQuery<SurveyFeaturesResponseDTO> = ({ transactionId, ...params }) =>
  useQuery({
    ...params,
    queryKey: getSurveyFeaturesQueryKey(transactionId),
    queryFn: () => new SurveyFeaturesControllerApi(apiConfig()).getSurveyFeatures({ transactionId }),
  });
