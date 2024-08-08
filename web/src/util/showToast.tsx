import { useShowLUIMessage } from "@linzjs/lui";
import { useCallback } from "react";

export const useShowToast = () => {
  const showMessage = useShowLUIMessage();

  const showErrorToast = useCallback(
    (message: string) =>
      showMessage({
        message: message,
        messageType: "toast",
        messageLevel: "error",
        requireDismiss: false,
      }),
    [showMessage],
  );

  const showSuccessToast = useCallback(
    (message: string) =>
      showMessage({
        message,
        messageType: "toast",
        messageLevel: "success",
        requireDismiss: false,
      }),
    [showMessage],
  );

  return {
    showErrorToast,
    showSuccessToast,
  };
};
