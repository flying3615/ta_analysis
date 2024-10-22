import { useLuiModalPrefab } from "@linzjs/windows";
import { ErrorInfo, useEffect } from "react";
import { useRouteError } from "react-router";

import { unhandledErrorModal } from "@/components/modals/unhandledErrorModal";

const errorHandler = (error: Error, info?: ErrorInfo) => {
  console.error(error, info);
  newrelic.noticeError(error);
};

export const RouteErrorBoundary = () => {
  const { showPrefabModal } = useLuiModalPrefab();
  const error = useRouteError() as Error;

  useEffect(() => {
    errorHandler(error);
    void showPrefabModal(unhandledErrorModal(error));
  }, [showPrefabModal, error]);

  return <></>;
};

export const ShowUnhandledModal = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  const { showPrefabModal } = useLuiModalPrefab();

  useEffect(() => {
    void showPrefabModal(unhandledErrorModal(error)).then(() => {
      resetErrorBoundary();
    });
  }, [showPrefabModal, error, resetErrorBoundary]);

  return <></>;
};
