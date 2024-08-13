import { useQuery } from "@tanstack/react-query";

import { surveyApiConfig } from "./apiConfig";
import { getPlanQueryKey } from "./plan";
import { PlanGenQuery } from "./types";

type TransactionTitleDTO = {
  surveyNo: string;
  surveyReference: string;
};

export const useGetPlanKeyQuery: PlanGenQuery<TransactionTitleDTO> = ({ transactionId }) => {
  return useQuery({
    queryKey: getPlanQueryKey(transactionId),
    queryFn: () => getSurveyTitle(transactionId),
  });
};

const getSurveyTitle = async (transactionId: number) => {
  const config = await surveyApiConfig();
  const basePath = config.basePath ?? "";
  const response = await fetch(`${basePath}/api/survey/${transactionId}/survey-title`, {
    headers: config.headers,
  });
  if (!response.ok) {
    throw new Error("Unable to get survey title.");
  }
  return await response.json();
};
