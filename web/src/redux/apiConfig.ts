import { appClientId } from "@/constants";
import { Configuration } from "@linz/survey-plan-generation-api-client";

export const planGenApiConfig = () => {
  const { apiGatewayBaseUrl, oidcIssuerUri } = window._env_;
  const storage = sessionStorage.getItem(`oidc.user:${oidcIssuerUri}:${appClientId}`);

  const accessToken = storage ? JSON.parse(storage).access_token : "";

  return new Configuration({
    basePath: `${apiGatewayBaseUrl}/v1/generate-plans`,
    accessToken,
  });
};
