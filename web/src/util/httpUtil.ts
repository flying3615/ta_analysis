import { initJourneyId, LINZ_JOURNEY_ID_HEADER_KEY } from "@linz/landonline-common-js";
import { accessToken } from "@linz/lol-auth-js";
import { FetchParams, Middleware, RequestContext } from "@linz/survey-plan-generation-api-client";
import { ulid } from "ulid";

import { RoutePaths } from "@/Paths";
import { LINZ_CORRELATION_ID } from "@/queries/types";

export enum helpNodeIds {
  PLAN_GENERATION = 10769,
  DEFINE_DIAGRAMS = 12220,
  LAYOUT_PLAN_SHEETS = 12221,
  MAINTAIN_DIAGRAM_LAYERS = 12222,
  LABEL_PREFERENCES = 12223,
}

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

export const hostProtoForApplication = (applicationPort: number, alwaysAbsolute: boolean = false): string => {
  const parts = location.host.split(":");
  if (parts.length === 1) {
    // default port, application will be on the same protocol and host
    return alwaysAbsolute ? `${location.protocol}//${location.host}` : "";
  }

  return `${location.protocol}//${parts[0]}:${applicationPort}`;
};

export const helpUrl = (nodeId: number, anchorId?: string) => {
  const baseUrl = "https://www.linz.govt.nz/node/";
  const fragment = anchorId ? `#${anchorId}` : "";
  return `${baseUrl}${nodeId}${fragment}`;
};

export const getHelpUrl = () => {
  const currentPath = window.location.pathname;
  switch (true) {
    case currentPath.includes(RoutePaths.defineDiagrams):
      return helpUrl(helpNodeIds.DEFINE_DIAGRAMS);
    case currentPath.includes(RoutePaths.layoutPlanSheets):
      return helpUrl(helpNodeIds.LAYOUT_PLAN_SHEETS);
    default:
      return helpUrl(helpNodeIds.PLAN_GENERATION);
  }
};
