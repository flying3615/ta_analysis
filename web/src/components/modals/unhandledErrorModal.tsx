import "./unhandledErrorModal.scss";

import { initJourneyId } from "@linz/landonline-common-js";
import { ErrorResponseDTO, ResponseError } from "@linz/survey-plan-generation-api-client";
import { LuiAccordicard, LuiButton, LuiIcon } from "@linzjs/lui";
import { useLuiModalPrefabProps } from "@linzjs/windows";
import { SerializedError } from "@reduxjs/toolkit";
import { PropsWithChildren } from "react";

import { LINZ_CUSTOMER_SUPPORT_EMAIL, LINZ_CUSTOMER_SUPPORT_PHONE } from "@/constants.tsx";

export interface ErrorWithResponse extends Error {
  timestamp?: Date;
  response?: {
    status: number | string;
    statusText?: string;
    url?: string;
    message?: string;
  };
}

export const unhandledErrorModal = (
  error: ErrorWithResponse,
  defaultToOpen: boolean = false,
): PropsWithChildren<useLuiModalPrefabProps<boolean>> => {
  const errorMessage = error.message;
  const stackTrace = error.stack;
  const timeOfOccurrence = (error.timestamp ?? Date()).toString();
  const browser = navigator.userAgent;
  const journeyId = initJourneyId(); // actually gets from cookie if exists
  const appWindow = window as unknown as {
    lolUser: string;
    lolSelectedFirm: string;
    lolIsInternal: string;
    location: { href: string };
  };
  const userInfo = JSON.stringify({
    user: appWindow.lolUser,
    selectedFirm: appWindow.lolSelectedFirm,
    isInternal: appWindow.lolIsInternal,
    url: appWindow.location.href,
  });

  const isApi = !!error.response;
  const apiClipboardMessage = isApi
    ? `
  status: ${error.response?.status},
  statusText: ${error.response?.statusText},
  apiUrl: ${error.response?.url},
  `
    : "";
  const notApiClipboardMessage = isApi
    ? ""
    : `
  stack:     ${stackTrace}
  `;

  const clipBoardMessage = `
  error:     ${errorMessage}
  time:      ${timeOfOccurrence}
  browser:   ${browser}
  journeyId: ${journeyId}
  userInfo:  ${userInfo}
  ${apiClipboardMessage}${notApiClipboardMessage}
  `;

  const handleCopyAction = () => {
    navigator.clipboard.writeText(clipBoardMessage).then();
  };

  console.error(`Unexpected error: ${errorMessage}`);

  return {
    level: "error",
    title: "Unexpected error",
    className: "UnhandledErrorModal",
    closeOnOverlayClick: true,
    children: (
      <div>
        <div className="UnhandledErrorModal-errorContent">
          <p className="UnhandledErrorModal-errorContentText">
            Refresh the page and if the problem persists, call us on&nbsp;
            <a href={`tel:${LINZ_CUSTOMER_SUPPORT_PHONE}`}>{LINZ_CUSTOMER_SUPPORT_PHONE}</a> or email&nbsp;
            <a href={`mailto:${LINZ_CUSTOMER_SUPPORT_EMAIL}`}>{LINZ_CUSTOMER_SUPPORT_EMAIL}</a>
          </p>
        </div>
        <LuiAccordicard
          defaultToOpen={defaultToOpen}
          headerContent={
            <div data-testid="detailed-error-info">
              <span>Detailed error information</span>
            </div>
          }
        >
          <>
            <div data-testid="detailed-error-info-id" className="UnhandledErrorModal-errorText">
              <h6>Error message:</h6>
              <pre>{errorMessage}</pre>
              {!isApi && (
                <>
                  <h6>Stack trace:</h6>
                  <pre>{stackTrace}</pre>
                </>
              )}
              {isApi && (
                <>
                  <h6>API Status:</h6>
                  <pre>{error.response?.status}</pre>
                  <h6>API Message:</h6>
                  <pre>{error.response?.statusText}</pre>
                  <h6>API URL:</h6>
                  <pre>{error.response?.url}</pre>
                </>
              )}
              <h6>Time occurred:</h6>
              <pre>{timeOfOccurrence}</pre>
              <h6>Browser info:</h6>
              <pre>{browser}</pre>
              <h6>Journey Id:</h6>
              <pre>{journeyId}</pre>
              <h6>User info:</h6>
              <pre>{userInfo}</pre>
            </div>
            <div className="UnhandledErrorModal-copy-button">
              <LuiButton
                size="sm"
                level="tertiary"
                disabled={false}
                onClick={handleCopyAction}
                className="lui-button-icon"
              >
                <LuiIcon size="md" name="ic_copy" alt="Copy to clipboard" className="UnhandledErrorModal-copy-icon" />
                Copy to clipboard
              </LuiButton>
            </div>
          </>
        </LuiAccordicard>
      </div>
    ),
    buttons: [{ title: "Dismiss", value: true, level: "tertiary" }],
  };
};

export const errorFromSerializedError = (error: SerializedError | Error | ErrorWithResponse): ErrorWithResponse => ({
  name: error.message ?? "Unknown API error",
  message: error.message || ("response" in error && error.response?.message) || "",
  response: {
    status: ("code" in error && error.code) || ("response" in error && error.response?.status) || "",
    statusText: ("response" in error && error.response?.statusText) || "",
    url: ("response" in error && error.response?.url) || "",
  },
});

export const errorFromResponseError = async (
  error: Error,
  customErrorResponse?: Partial<ErrorWithResponse>,
): Promise<ErrorWithResponse> => {
  const responseError = error as ResponseError;
  const errorResponse = (await responseError.response.json()) as ErrorResponseDTO | undefined;
  return {
    message: customErrorResponse?.message ?? responseError.message,
    name: customErrorResponse?.name ?? responseError.name,
    stack: customErrorResponse?.stack ?? responseError.stack,
    response: {
      status: customErrorResponse?.response?.status ?? responseError.response.status,
      statusText: customErrorResponse?.response?.statusText ?? errorResponse?.message,
    },
  };
};
