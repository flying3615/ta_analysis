import { useUserProfile } from "@linz/lol-auth-js";
import { useLuiModalPrefab } from "@linzjs/windows";
import { useLuiModalPrefabProps } from "@linzjs/windows/dist/LuiModalAsync/useLuiModalPrefab";
import type { DefaultError } from "@tanstack/query-core";
import { QueryObserverOptions, useQueryClient } from "@tanstack/react-query";
import { PropsWithChildren, useMemo, useRef, useState } from "react";

import {
  failedToLoadLocksModal,
  surveyLockCheckInProgressModal,
  surveyLockedModal,
} from "@/components/modals/surveyLockedModal";
import { useTransactionId } from "@/hooks/useTransactionId";
import { getsertLock, getsertLockQueryKey, updateLockLastUsed } from "@/queries/lock";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags";
import { hostProtoForApplication } from "@/util/httpUtil";
import {
  useCreateAndMaintainLockResult,
  useQueryRefetchOnUserInteraction,
} from "@/util/useQueryRefetchOnUserInteraction";

export interface useCreateAndMaintainLock {
  isLoading: boolean;
  lockPreviouslyHeld: boolean;
}

export const useCreateAndMaintainLock = (): useCreateAndMaintainLock => {
  const transactionId = useTransactionId();
  const userProfile = useUserProfile();
  const queryClient = useQueryClient();
  const { showPrefabModal } = useLuiModalPrefab();

  const { result: maintainLocksAllowed } = useFeatureFlags(FEATUREFLAGS.SURVEY_PLAN_GENERATION_MAINTAIN_LOCKS);

  const lockPreviouslyHeldRef = useRef(false);
  const [stopLockChecks, setStopLockChecks] = useState(false);

  const queryOptions: QueryObserverOptions<unknown, DefaultError, useCreateAndMaintainLockResult> = useMemo(() => {
    // Re-login modal doesn't check if user has changed so userId must be part of the queryKey
    const queryKey = getsertLockQueryKey(transactionId, userProfile?.id);
    return {
      // eslint incorrectly showing warning here as it cant understand a query key created outside an object
      // eslint-disable-next-line @tanstack/query/exhaustive-deps
      queryKey,
      queryFn: async () => {
        const locksPreviouslyLoaded = !!queryClient.getQueryData(queryKey);
        const loadingLocksModal = !locksPreviouslyLoaded && showPrefabModal(surveyLockCheckInProgressModal);
        const closeLoadingLocksModal = () => {
          if (loadingLocksModal) {
            loadingLocksModal?.resolve(true);
          }
        };

        const showFailureModal = async (modal: PropsWithChildren<useLuiModalPrefabProps<boolean>>) => {
          closeLoadingLocksModal();
          setStopLockChecks(true);
          await showPrefabModal(modal);
          window.location.href = `${hostProtoForApplication(8080)}/survey/${transactionId}`;
          return {
            lockOwnedByUser: false,
          };
        };

        const locks = await getsertLock(transactionId);

        if (!locks) {
          return showFailureModal(failedToLoadLocksModal);
        }

        const transactionLock = locks.transactionLock;
        const hasLockId = (transactionLock.lockedId ?? 0) > 0;
        const lockedByUser = transactionLock.lockedBy?.id;
        const lockOwnedByUser = hasLockId && lockedByUser === userProfile?.id;

        if (!lockOwnedByUser) {
          return showFailureModal(surveyLockedModal(lockedByUser));
        }

        // locks.transactionLock.lockedId will always exist at this point ?? -1 is for the compiler warning
        if (!(await updateLockLastUsed(transactionId, locks.transactionLock.lockedId ?? -1))) {
          return showFailureModal(failedToLoadLocksModal);
        }

        closeLoadingLocksModal();
        return {
          lockOwnedByUser: true,
        };
      },
      refetchOnWindowFocus: true,
      staleTime: 30000,
      enabled: maintainLocksAllowed && !stopLockChecks,
    };
  }, [transactionId, userProfile?.id, maintainLocksAllowed, stopLockChecks, queryClient, showPrefabModal]);

  const { isLoading, data } = useQueryRefetchOnUserInteraction(queryOptions);

  // We don't want re-auth to unload/reload the Layout PlanSheets/Diagrams as it will trigger a regenerate plan
  // At this point we know the pages have run plan-gen already and won't throw an exception by re-running plangen
  lockPreviouslyHeldRef.current ||= !!data?.lockOwnedByUser;

  return {
    isLoading,
    lockPreviouslyHeld: lockPreviouslyHeldRef.current || !maintainLocksAllowed,
  };
};
