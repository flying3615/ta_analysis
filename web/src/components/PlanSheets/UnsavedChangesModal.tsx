import { LuiAlertModalV2, LuiButton, LuiModalV2 } from "@linzjs/lui";
import { useCallback, useEffect, useState } from "react";
import { useBeforeUnload, useBlocker } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { clearRecoveryFile } from "@/hooks/usePlanAutoRecover";
import { useTransactionId } from "@/hooks/useTransactionId";
import { hasChanges, hasNavigateAfterSave, navigateAfterSave } from "@/redux/planSheets/planSheetsSlice";
import { revertAll } from "@/redux/revertAll";

export const UnsavedChangesModal = ({
  updatePlan,
  updatePlanIsPending,
  updatePlanIsSuccess,
  updatePlanReset,
}: {
  updatePlan: () => void;
  updatePlanIsPending: boolean | undefined;
  updatePlanIsSuccess: boolean;
  updatePlanReset: () => void;
}) => {
  const dispatch = useAppDispatch();
  const hasUnsavedChanges = useAppSelector(hasChanges);
  const externalUrl = useAppSelector(hasNavigateAfterSave);
  const [allowExternalNavigation, setAllowExternalNavigation] = useState(true);
  const transactionId = useTransactionId();

  useEffect(() => {
    setAllowExternalNavigation(!hasUnsavedChanges);
  }, [hasUnsavedChanges]);

  const shouldBlockForUnsavedChanges =
    // block when unsaved changes
    hasUnsavedChanges &&
    // and either no externalUrl
    (!externalUrl ||
      // or externalUrl that hasn't allowed external navigation
      (!!externalUrl && !allowExternalNavigation));

  const beforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (shouldBlockForUnsavedChanges) {
        event.preventDefault();
      }
    },
    [shouldBlockForUnsavedChanges],
  );
  useBeforeUnload(beforeUnload);
  useEffect(() => {
    if (hasUnsavedChanges) {
      // document beforeunload => browser alert
      // this may occur if user navigates via address bar or bookmark
      document.addEventListener("beforeunload", beforeUnload);
    }
    return () => document.removeEventListener("beforeunload", beforeUnload);
  }, [beforeUnload, hasUnsavedChanges]);

  const blocker = useBlocker(shouldBlockForUnsavedChanges);

  useEffect(() => {
    if (!shouldBlockForUnsavedChanges && externalUrl) {
      // external navigation when not blocked
      window.location.href = externalUrl;
    }
  }, [shouldBlockForUnsavedChanges, externalUrl]);

  const handleCancel = () => {
    if (blocker.state === "blocked") {
      blocker.reset();
    } else if (externalUrl) {
      dispatch(navigateAfterSave(undefined));
    }
  };

  const handleLeave = () => {
    void clearRecoveryFile(transactionId);
    if (blocker.state === "blocked") {
      blocker.proceed();
      dispatch(revertAll());
    } else if (externalUrl) {
      setAllowExternalNavigation(true);
    }
  };

  const handleSave = () => {
    updatePlan();
  };

  useEffect(() => {
    if (blocker.state === "blocked" && updatePlanIsSuccess) {
      setTimeout(() => {
        blocker.proceed();
      }, 20); // Short delay so that the toast message has time to be initialised
    } else if (updatePlanIsSuccess) {
      // reset updatePlanIsSuccess after save so future unsaved changes are blocked
      updatePlanReset();
    }
  }, [blocker, updatePlanIsSuccess, updatePlanReset]);

  // blocked or externalUrl => show
  if (blocker.state !== "blocked" && !externalUrl) {
    return null;
  }

  // save in progress
  if (updatePlanIsPending || !shouldBlockForUnsavedChanges) {
    return null;
  }

  return (
    <LuiAlertModalV2 level="warning" headingText="You have unsaved changes" onClose={handleCancel}>
      <p>If you navigate away from Layout Plan Sheets without saving, you will lose any unsaved changes.</p>
      <LuiModalV2.Buttons>
        <LuiButton level="tertiary" onClick={handleCancel}>
          Cancel
        </LuiButton>
        <LuiButton level="tertiary" onClick={handleLeave}>
          Leave
        </LuiButton>
        <LuiButton level="tertiary" onClick={handleSave}>
          Save & leave
        </LuiButton>
      </LuiModalV2.Buttons>
    </LuiAlertModalV2>
  );
};
