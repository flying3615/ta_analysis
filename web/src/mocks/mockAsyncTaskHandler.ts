import { AsyncTaskDTOStatusEnum, AsyncTaskDTOTypeEnum } from "@linz/survey-plan-generation-api-client";
import { HttpResponse, HttpResponseResolver } from "msw";

import { AsyncTaskBuilder } from "./builders/AsyncTaskBuilder";

export const successfulRegeneratePlanTaskId = "f81d4fae-7dec-11d0-a765-00a0c91e6bf6";
export const failedRegeneratePlanTaskId = "fc3c9389-2b41-4b28-8c58-a6c37fe253e0";

export const successfulUpdatePlanTaskId = "adca86c9-ad15-4900-9d80-8a4d3a0ccad3";
export const failedUpdatePlanTaskId = "0c4cc3d2-752b-4100-bd31-cdd0897825de";

const getTaskType = (taskId: string): AsyncTaskDTOTypeEnum => {
  if ([successfulRegeneratePlanTaskId, failedRegeneratePlanTaskId].includes(taskId)) {
    return AsyncTaskDTOTypeEnum.REGENERATE_PLAN;
  }
  return AsyncTaskDTOTypeEnum.UPDATE_PLAN;
};

const getTaskStatus = (taskId: string): AsyncTaskDTOStatusEnum => {
  if ([successfulRegeneratePlanTaskId, successfulUpdatePlanTaskId].includes(taskId)) {
    return AsyncTaskDTOStatusEnum.COMPLETE;
  } else if ([failedRegeneratePlanTaskId, failedUpdatePlanTaskId].includes(taskId)) {
    return AsyncTaskDTOStatusEnum.FAILED;
  }
  return AsyncTaskDTOStatusEnum.IN_PROGRESS;
};

export const mockAsyncTaskGeneratorHandler: HttpResponseResolver = function* ({ request }) {
  const taskId = new URL(request.url).searchParams.get("taskId");
  if (!taskId) {
    throw new Error("taskId URL param not passed for /async-task request");
  }

  const response = new AsyncTaskBuilder().withTaskId(taskId).withType(getTaskType(taskId));

  // On first call return in progress status, then subsequent calls will return complete/failed
  yield HttpResponse.json(response.withInProgressStatus().build(), { status: 200, statusText: "OK" });

  return HttpResponse.json(response.withStatus(getTaskStatus(taskId)).build(), { status: 200, statusText: "OK" });
};
