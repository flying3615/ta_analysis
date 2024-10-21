import { useUserProfile } from "@linz/lol-auth-js";
import { useMemo } from "react";

import { useTransactionId } from "@/hooks/useTransactionId";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags";
import { useQueryRefetchOnUserInteraction } from "@/util/useQueryRefetchOnUserInteraction";

import { surveyApiConfig } from "./apiConfig";

export interface UserDetail {
  givenNames: string | null;
  id: string;
  surname: string | null;
}

export interface TransactionLockDTO {
  isNewAppLock: boolean;
  locked: boolean;
  lockedAt: string | null;
  lockedBy: UserDetail | null;
  lockedEntityId: number | null;
  lockedId: number | null;
  sessionUser: string | null;
  type: string | null;
}

export interface LocksDTO {
  taCertificationRequestLocks: Array<TransactionLockDTO>;
  transactionLock: TransactionLockDTO;
}

export type TransactionalLockDTOStatusEnum = "COMPLETED" | "ON_HOLD" | "IN_PROGRESS";

export interface TransactionalLockDTO {
  id: number;
  lastUsedAt: string;
  newLock: boolean | null;
  status: TransactionalLockDTOStatusEnum;
  userId: string;
}

export interface useCreateAndMaintainLockQueryResult {}

export const updateLockLastUsed = async (transactionId: number, lockId: number): Promise<TransactionalLockDTO> => {
  const config = await surveyApiConfig();
  const basePath = config.basePath ?? "";
  const response = await fetch(`${basePath}/api/survey/${transactionId}/locks/${lockId}/lastUsed`, {
    method: "PUT",
    headers: config.headers,
  });
  if (!response.ok) {
    throw new Error("Unable to update locks lastUsed");
  }
  return (await response.json()) as TransactionalLockDTO;
};

export const getsertLockQueryKey = (transactionId: number, userId: string | undefined) => [
  "survey",
  transactionId,
  "transactionLock",
  userId,
];

export const getsertLock = async (transactionId: number): Promise<LocksDTO> => {
  const config = await surveyApiConfig();
  const basePath = config.basePath ?? "";
  const response = await fetch(`${basePath}/api/survey/${transactionId}/locks`, {
    headers: config.headers,
  });
  if (!response.ok) {
    throw new Error("Unable to get Locks");
  }
  return (await response.json()) as LocksDTO;
};

export const useCreateAndMaintainLockQuery = () => {
  const transactionId = useTransactionId();
  const userProfile = useUserProfile();
  const { result: maintainLocksAllowed } = useFeatureFlags(FEATUREFLAGS.SURVEY_PLAN_GENERATION_MAINTAIN_DIAGRAM_LAYERS);

  const options = useMemo(
    () => ({
      // Re-login modal doesn't check if user has changed so userId must be part of the queryKey
      queryKey: getsertLockQueryKey(transactionId, userProfile?.id),
      queryFn: async () => {
        // TODO handle failure SRVPUW-1057
        const locks = await getsertLock(transactionId);
        const transactionLock = locks?.transactionLock;
        const hasLockId = (transactionLock.lockedId ?? 0) > 0;
        const lockOwnedByUser = hasLockId && transactionLock.lockedBy?.id === transactionLock.sessionUser;
        if (lockOwnedByUser) {
          // TODO handle failure SRVPUW-1057
          await updateLockLastUsed(transactionId, locks?.transactionLock.lockedId ?? -1);
        } else {
          // TODO lock not held by this user SRVPUW-1057
          // Redirect back to my work
          // window.location.href = `${hostProtoForApplication(8080)}/survey/${transactionId}`;
          // showModal("Survey is locked by xxxxx");
        }
        return locks;
      },
      refetchOnWindowFocus: true,
      staleTime: 30000,
      enabled: maintainLocksAllowed,
    }),
    [maintainLocksAllowed, transactionId, userProfile?.id],
  );

  return useQueryRefetchOnUserInteraction(options);
};
