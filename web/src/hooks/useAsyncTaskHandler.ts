import { AsyncTaskDTO, AsyncTaskDTOStatusEnum } from "@linz/survey-plan-generation-api-client";
import { UseMutationResult } from "@tanstack/react-query";
import { useEffect } from "react";

import { useGetAsyncTaskStatusQuery } from "@/queries/asyncTask";

import { useTransactionId } from "./useTransactionId";

/**
 * Wrapper around querying of async task status.
 *
 * @param triggerTaskMutation react-query mutation that triggers the async task
 * @param refetchIntervalMs How often to refetch the async task status
 * @returns
 */
export const useAsyncTaskHandler = <MutationRequestBody>(
  triggerTaskMutation: UseMutationResult<AsyncTaskDTO | null, Error, MutationRequestBody, unknown>,
  refetchIntervalMs = 10_000,
) => {
  const transactionId = useTransactionId();
  const taskId = triggerTaskMutation.data?.taskId;
  const triggerTaskIsSuccess = triggerTaskMutation.isSuccess;

  const {
    data: task,
    refetch: refetchTask,
    error: taskError,
    isPending: taskRequestIsPending,
  } = useGetAsyncTaskStatusQuery({
    transactionId,
    taskId: taskId ?? "",
    enabled: triggerTaskIsSuccess && !!taskId,
  });
  const taskStatus = task?.status;
  const taskIsInProgress =
    taskStatus &&
    ([AsyncTaskDTOStatusEnum.IN_PROGRESS, AsyncTaskDTOStatusEnum.QUEUED] as AsyncTaskDTOStatusEnum[]).includes(
      taskStatus,
    );

  useEffect(() => {
    if (!triggerTaskIsSuccess || !taskIsInProgress) {
      return;
    }
    const interval = setInterval(() => void refetchTask(), refetchIntervalMs);
    return () => clearInterval(interval);
  }, [taskIsInProgress, triggerTaskIsSuccess, refetchTask, refetchIntervalMs]);

  return {
    isSuccess: triggerTaskIsSuccess && (!taskId || taskStatus === AsyncTaskDTOStatusEnum.COMPLETE),
    isError: taskStatus === AsyncTaskDTOStatusEnum.FAILED,
    isPending: taskIsInProgress || (triggerTaskIsSuccess && taskRequestIsPending),
    error: triggerTaskMutation.error ?? taskError,
  };
};
