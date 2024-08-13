import { initJourneyId } from "@linz/landonline-common-js";
import { Configuration, HTTPHeaders } from "@linz/survey-plan-generation-api-client";
import { ulid } from "ulid";

export const LINZ_CORRELATION_ID = "x-linz-correlation-id";
export const LINZ_JOURNEY_ID_HEADER_KEY = "x-linz-journey-id";

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

export const surveyApiConfig = async () => {
  const { surveyBaseUrl } = window._env_;
  return new Configuration({
    basePath: surveyBaseUrl,
    headers: { [LINZ_JOURNEY_ID_HEADER_KEY]: initJourneyId(), ...generateHeaders() }, // survey still uses journeyId in headers
  });
};
