import { useCallback } from "react";

import { useShowToast } from "@/util/showToast";

export interface ActionToastProps {
  errorMessage: string;
  successMessage?: string;
}

export const exceptionMessage = (ex: unknown): string => {
  if (ex == null || typeof ex !== "object" || !("message" in ex)) {
    return "unexpected error";
  }
  const message = ex.message;
  // Convert openapi error to unexpected error
  if (typeof message !== "string" || !message || message === "Response returned an error code") {
    return "unexpected error";
  }

  return message;
};

export const prefixException = (ex: unknown, prefix: string) => {
  const message = exceptionMessage(ex);
  // Lol error messages should not be prefixed
  return `${message.startsWith("Error ") ? "" : `${prefix} `}${message}`;
};

export const useActionToast = () => {
  const { showSuccessToast, showErrorToast } = useShowToast();

  return useCallback(
    async (mutationCall: () => Promise<unknown>, { errorMessage, successMessage }: ActionToastProps) => {
      try {
        await mutationCall();
        if (successMessage) {
          showSuccessToast(successMessage);
        }
      } catch (ex) {
        showErrorToast(prefixException(ex, errorMessage));
      }
    },
    [showErrorToast, showSuccessToast],
  );
};
