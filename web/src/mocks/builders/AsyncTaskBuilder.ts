import { AsyncTaskDTO, AsyncTaskDTOStatusEnum, AsyncTaskDTOTypeEnum } from "@linz/survey-plan-generation-api-client";
import { ulid } from "ulid";

import { BaseBuilder } from "./BaseBuilder";

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

  withType(type: AsyncTaskDTOTypeEnum) {
    this.type = type;
    return this;
  }

  withStatus(status: AsyncTaskDTOStatusEnum) {
    this.status = status;
    return this;
  }

  withQueuedStatus() {
    return this.withStatus(AsyncTaskDTOStatusEnum.QUEUED);
  }

  withInProgressStatus() {
    return this.withStatus(AsyncTaskDTOStatusEnum.IN_PROGRESS);
  }

  withInterruptedStatus() {
    return this.withStatus(AsyncTaskDTOStatusEnum.INTERRUPTED);
  }

  withCompleteStatus() {
    return this.withStatus(AsyncTaskDTOStatusEnum.COMPLETE);
  }

  withFailedStatus() {
    return this.withStatus(AsyncTaskDTOStatusEnum.FAILED);
  }

  build(): AsyncTaskDTO {
    return {
      taskId: this.taskId,
      type: this.type,
      status: this.status,
    };
  }
}
