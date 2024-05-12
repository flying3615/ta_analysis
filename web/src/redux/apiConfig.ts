import { Configuration } from "@linz/survey-plan-generation-api-client";

export const planGenApiConfig = () => {
  const { apiGatewayBaseUrl } = window._env_;

  return new Configuration({
    basePath: `${apiGatewayBaseUrl}/v1/generate-plans`,
  });
};
