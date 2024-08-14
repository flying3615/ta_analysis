import { Configuration } from "@linz/survey-plan-generation-api-client";

import { addHeaders, generateStandardHeaders, LinzHeaderMiddleware } from "@/util/httpUtil";

export const apiConfig = () => {
  const { apiGatewayBaseUrl } = window._env_;
  return new Configuration({
    basePath: `${apiGatewayBaseUrl}/v1/generate-plans`,
    headers: generateStandardHeaders(),
  });
};

export const surveyApiConfig = async () => {
  const { surveyBaseUrl } = window._env_;
  return new Configuration({
    basePath: surveyBaseUrl,
    middleware: [new LinzHeaderMiddleware()],
    headers: await addHeaders(),
  });
};
