import { AsyncTaskDTO, AsyncTaskDTOStatusEnum, AsyncTaskDTOTypeEnum } from "@linz/survey-plan-generation-api-client";
import { ulid } from "ulid";

import { BaseBuilder } from "./BaseBuilder";

export const successfulTaskId = "f81d4fae-7dec-11d0-a765-00a0c91e6bf6";

export const failedTaskId = "fc3c9389-2b41-4b28-8c58-a6c37fe253e0";

export class AsyncTaskBuilder implements BaseBuilder<AsyncTaskDTO> {
  private taskId: string;
  private type: AsyncTaskDTOTypeEnum;
  private status: AsyncTaskDTOStatusEnum;

  constructor() {
    this.taskId = ulid();
    this.type = AsyncTaskDTOTypeEnum.REGENERATE_PLAN;
    this.status = AsyncTaskDTOStatusEnum.QUEUED;
  }

  withTaskId(taskId: string) {
    this.taskId = taskId;
    return this;
  }

  withRegeneratePlanType() {
    this.type = AsyncTaskDTOTypeEnum.REGENERATE_PLAN;
    return this;
  }

  withQueuedStatus() {
    this.status = AsyncTaskDTOStatusEnum.QUEUED;
    return this;
  }

  withInProgressStatus() {
    this.status = AsyncTaskDTOStatusEnum.IN_PROGRESS;
    return this;
  }

  withCompleteStatus() {
    this.status = AsyncTaskDTOStatusEnum.COMPLETE;
    return this;
  }

  withFailedStatus() {
    this.status = AsyncTaskDTOStatusEnum.FAILED;
    return this;
  }

  build(): AsyncTaskDTO {
    return {
      taskId: this.taskId,
      type: this.type,
      status: this.status,
    };
  }
}
