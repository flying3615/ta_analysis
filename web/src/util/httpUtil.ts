import { initJourneyId, LINZ_JOURNEY_ID_HEADER_KEY } from "@linz/landonline-common-js";
import { accessToken } from "@linz/lol-auth-js";
import { FetchParams, Middleware, RequestContext } from "@linz/survey-plan-generation-api-client";
import { ulid } from "ulid";

import { LINZ_CORRELATION_ID } from "@/queries/types";

/**
 *  Correlation ID (ULID) - used for matching requests to logs.
 *  Journey ID (ULID) - Used for tracking user requests
 */
export function generateStandardHeaders(): Record<string, string> {
  return {
    [LINZ_CORRELATION_ID]: generateUniqueValue(),
    [LINZ_JOURNEY_ID_HEADER_KEY]: initJourneyId(),
  };
}

export const generateUniqueValue = () => ulid(Number.parseInt((new Date().getTime() / 1000).toString()));

export class LinzHeaderMiddleware implements Middleware {
  async pre({ url, init }: RequestContext): Promise<FetchParams> {
    const headers = {
      ...init.headers,
      ...(await addHeaders()),
    };
    return { url, init: { ...init, headers } };
  }
}

export const addHeaders = async () => {
  const token = await accessToken();
  return {
    "Content-Type": "application/json",
    ...generateStandardHeaders(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
