import { AsyncTaskControllerApi, GetTaskRequest } from "@linz/survey-plan-generation-api-client";
import { useQuery } from "@tanstack/react-query";

import { apiConfig } from "@/queries/apiConfig";

export const getAsyncTaskStatusQueryKey = (transactionId: number, taskId: string) => [
  "getAsyncTaskStatus",
  transactionId,
  taskId,
];

export const useGetAsyncTaskStatusQuery = ({ transactionId, taskId, enabled }: GetTaskRequest & { enabled: boolean }) =>
  useQuery({
    queryKey: getAsyncTaskStatusQueryKey(transactionId, taskId),
    queryFn: async () => {
      return await new AsyncTaskControllerApi(apiConfig()).getTask({ transactionId, taskId });
    },
    enabled,
  });
