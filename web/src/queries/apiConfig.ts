import { Configuration } from "@linz/survey-plan-generation-api-client";

import { generateStandardHeaders } from "@/util/httpUtil";

export const apiConfig = () => {
  const { apiGatewayBaseUrl } = window._env_;
  return new Configuration({
    basePath: `${apiGatewayBaseUrl}/v1/generate-plans`,
    headers: generateStandardHeaders(),
  });
};

export const surveyApiConfig = () => {
  const { surveyBaseUrl } = window._env_;
  return new Configuration({
    basePath: surveyBaseUrl,
    headers: generateStandardHeaders(),
  });
};
