import { Configuration, HTTPHeaders } from "@linz/survey-plan-generation-api-client";
import { ulid } from "ulid";

export const LINZ_CORRELATION_ID = "x-linz-correlation-id";

const generateHeaders = (): HTTPHeaders => {
  return {
    [LINZ_CORRELATION_ID]: ulid(),
  };
};

export const apiConfig = () => {
  const { apiGatewayBaseUrl } = window._env_;

  return new Configuration({
    basePath: `${apiGatewayBaseUrl}/v1/generate-plans`,
    headers: generateHeaders(),
  });
};
