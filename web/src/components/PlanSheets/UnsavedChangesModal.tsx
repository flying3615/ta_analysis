import { LuiAlertModalV2, LuiButton, LuiModalV2 } from "@linzjs/lui";
import { useCallback, useEffect } from "react";
import { useBeforeUnload, useBlocker } from "react-router-dom";

import { useAppSelector } from "@/hooks/reduxHooks";
import { hasChanges } from "@/redux/planSheets/planSheetsSlice";

export const UnsavedChangesModal = ({
  updatePlan,
  updatePlanIsPending,
  updatePlanIsSuccess,
}: {
  updatePlan: () => void;
  updatePlanIsPending: boolean | undefined;
  updatePlanIsSuccess: boolean;
}) => {
  const hasUnsavedChanges = useAppSelector(hasChanges);

  const beforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
      }
    },
    [hasUnsavedChanges],
  );
  useBeforeUnload(beforeUnload);

  const blocker = useBlocker(hasUnsavedChanges);

  useEffect(() => {
    if (blocker.state === "blocked" && updatePlanIsSuccess) {
      setTimeout(() => {
        blocker.proceed();
      }, 20); // Short delay so that the toast message has time to be initialised
    }
  }, [blocker, updatePlanIsSuccess]);

  if (blocker.state !== "blocked") {
    return null;
  }

  if (updatePlanIsPending) {
    return null;
  }

  return (
    <LuiAlertModalV2 level="warning" headingText="You have unsaved changes" onClose={() => blocker.reset()}>
      <p>If you navigate away from Layout Plan Sheets without saving, you will lose any unsaved changes</p>
      <LuiModalV2.Buttons>
        <LuiButton level="tertiary" onClick={() => blocker.reset()}>
          Cancel
        </LuiButton>
        <LuiButton level="tertiary" onClick={() => blocker.proceed()}>
          Leave
        </LuiButton>
        <LuiButton level="tertiary" onClick={updatePlan}>
          Save & leave
        </LuiButton>
      </LuiModalV2.Buttons>
    </LuiAlertModalV2>
  );
};
