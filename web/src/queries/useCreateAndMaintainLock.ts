import { useUserProfile } from "@linz/lol-auth-js";
import { useLuiModalPrefab } from "@linzjs/windows";
import { useLuiModalPrefabProps } from "@linzjs/windows/dist/LuiModalAsync/useLuiModalPrefab";
import { useQueryClient } from "@tanstack/react-query";
import { PropsWithChildren, useMemo, useState } from "react";

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
import { useQueryRefetchOnUserInteraction } from "@/util/useQueryRefetchOnUserInteraction";

export const useCreateAndMaintainLock = () => {
  const transactionId = useTransactionId();
  const userProfile = useUserProfile();
  const queryClient = useQueryClient();
  const { showPrefabModal } = useLuiModalPrefab();

  const { result: maintainLocksAllowed } = useFeatureFlags(FEATUREFLAGS.SURVEY_PLAN_GENERATION_MAINTAIN_LOCKS);

  const [stopLockChecks, setStopLockChecks] = useState(false);

  const options = useMemo(() => {
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
          return null;
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
        return locks;
      },
      refetchOnWindowFocus: true,
      staleTime: 30000,
      enabled: maintainLocksAllowed && !stopLockChecks,
    };
  }, [transactionId, userProfile?.id, maintainLocksAllowed, stopLockChecks, queryClient, showPrefabModal]);

  useQueryRefetchOnUserInteraction(options);
};
