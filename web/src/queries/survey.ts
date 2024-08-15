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
    queryFn: async () => {
      const response = await getSurveyTitle(transactionId);
      const { surveyNo, surveyReference } = response;
      document.title = surveyNo.length
        ? `Landonline - Plan Generation${surveyNo ? ` - ${surveyNo}` : ""}${surveyReference?.length ? ` - ${surveyReference}` : ""}`
        : "Landonline Survey Plan Generation";
      return response;
    },
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
