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

export const updateLockLastUsed = async (
  transactionId: number,
  lockId: number,
): Promise<TransactionalLockDTO | null> => {
  const config = surveyApiConfig();
  const basePath = config.basePath ?? "";
  const response = await fetch(`${basePath}/api/survey/${transactionId}/locks/${lockId}/lastUsed`, {
    method: "PUT",
    headers: config.headers,
  });
  if (!response.ok) {
    console.error("locks update lastUsed failed", response);
    return null;
  }
  return (await response.json()) as TransactionalLockDTO;
};

export const getsertLockQueryKey = (transactionId: number, userId: string | undefined) => [
  "survey",
  transactionId,
  "transactionLock",
  userId,
];

export const getsertLock = async (transactionId: number): Promise<LocksDTO | null> => {
  const config = surveyApiConfig();
  const basePath = config.basePath ?? "";
  const response = await fetch(`${basePath}/api/survey/${transactionId}/locks`, {
    headers: config.headers,
  });
  if (!response.ok) {
    console.error("getsert locks failed", response);
    return null;
  }
  return (await response.json()) as LocksDTO;
};
