import { useLuiModalPrefabProps } from "@linzjs/windows";
import { PropsWithChildren, useCallback, useEffect, useState } from "react";

import { regenerationRequiredModal } from "@/components/modals/regenerationRequiredModal";
import { usePlanRegenerationStatusMutation } from "@/queries/planRegenerate";

export interface UseRegenerationRequiredCheckProps {
  transactionId: number;
  regenComplete: boolean;
  showPrefabModal: (modalDef: PropsWithChildren<useLuiModalPrefabProps<boolean>>) => Promise<unknown>;
  setIsPlanDataReady: (isPlanDataReady: boolean) => void;
  regenerateMutate: () => void;
  resetRegeneration: () => void;
  checkRegenerationStatusEnabled: boolean;
}

export const useRegenerationRequiredCheck = ({
  transactionId,
  regenComplete,
  showPrefabModal,
  setIsPlanDataReady,
  regenerateMutate,
  resetRegeneration,
  checkRegenerationStatusEnabled,
}: UseRegenerationRequiredCheckProps) => {
  const [isRegenRequiredDisplayed, setIsRegenRequiredDisplayed] = useState(false);
  const onRegenerationRequired = useCallback(() => {
    if (isRegenRequiredDisplayed || !checkRegenerationStatusEnabled) {
      return;
    }
    setIsRegenRequiredDisplayed(true);
    void showPrefabModal(regenerationRequiredModal()).then(() => {
      resetRegeneration();
      setIsPlanDataReady(false);
      regenerateMutate();
      setIsRegenRequiredDisplayed(false);
    });
  }, [
    resetRegeneration,
    setIsPlanDataReady,
    regenerateMutate,
    showPrefabModal,
    isRegenRequiredDisplayed,
    setIsRegenRequiredDisplayed,
    checkRegenerationStatusEnabled,
  ]);

  const { mutate: mutatePlanRegenerationStatus } = usePlanRegenerationStatusMutation(
    transactionId,
    onRegenerationRequired,
  );
  useEffect(() => {
    const listener = (e: Event) => {
      if (
        e.type === "visibilitychange" &&
        document.visibilityState === "visible" &&
        regenComplete &&
        checkRegenerationStatusEnabled
      ) {
        mutatePlanRegenerationStatus();
      }
    };
    window.addEventListener("visibilitychange", listener);
    return () => window.removeEventListener("visibilitychange", listener);
  }, [regenComplete, mutatePlanRegenerationStatus, checkRegenerationStatusEnabled]);
};
