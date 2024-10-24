import { useQuery } from "@tanstack/react-query";

import { surveyApiConfig } from "./apiConfig";
import { PlanGenQuery } from "./types";

type TransactionTitleDTO = {
  surveyNo: string;
  surveyReference: string;
};

export type ExternalSurveyInfoDto = {
  corporateName: string;
  datasetId: string;
  datasetSeries: string;
  description: string;
  givenNames: string;
  localityName: string;
  officeCode: string;
  surname: string;
  surveyDate: string;
  systemCodeDescription: string;
};

export const getSurveyTitleQueryKey = (transactionId: number) => ["survey-title", transactionId];

export interface useGetSurveyTitleQueryProps {
  transactionId: number;
}

export const useGetSurveyTitleQuery = ({ transactionId }: useGetSurveyTitleQueryProps) => {
  return useQuery({
    queryKey: getSurveyTitleQueryKey(transactionId),
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

const getSurveyTitle = async (transactionId: number): Promise<TransactionTitleDTO> => {
  const config = surveyApiConfig();
  const basePath = config.basePath ?? "";
  const response = await fetch(`${basePath}/api/survey/${transactionId}/survey-title`, {
    headers: config.headers,
  });
  if (!response.ok) {
    throw new Error("Unable to get survey title.");
  }
  return (await response.json()) as TransactionTitleDTO;
};
export const getSurveyInfoQueryKey = (transactionId: number) => ["getSurveyInfo", transactionId];

export const useSurveyInfoQuery: PlanGenQuery<ExternalSurveyInfoDto> = ({ transactionId }) => {
  return useQuery({
    queryKey: getSurveyInfoQueryKey(transactionId),
    queryFn: async () => {
      return await getSurveyInfo(transactionId);
    },
  });
};

const getSurveyInfo = async (transactionId: number) => {
  const config = surveyApiConfig();
  const basePath = config.basePath ?? "";
  const response = await fetch(`${basePath}/api/survey/${transactionId}/survey-info`, {
    headers: config.headers,
  });
  if (!response.ok) {
    throw new Error("Unable to get survey info.");
  }
  return (await response.json()) as ExternalSurveyInfoDto;
};
