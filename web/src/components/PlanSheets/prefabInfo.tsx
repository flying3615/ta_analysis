import { useLuiModalPrefabProps } from "@linzjs/windows";
import { PropsWithChildren } from "react";

export const info126026_planGenCompileSuccess: PropsWithChildren<useLuiModalPrefabProps> = {
  style: { width: "480px", maxWidth: "480px" },
  level: "info",
  title: "Plan Generation Completed!",
  children:
    "The plan generation process has been successfully completed and a compilation batch request has been logged. " +
    "When the batch is completed, a copy of the compiled Digital Survey Plan and a Digital Title Plan will be sent to " +
    "the surveyor and primary contact via online messaging.",
  buttons: [
    {
      title: "Dismiss",
      value: undefined,
    },
  ],
};

export const info126026_planGenCompileProgress = (batchRunTime: string): PropsWithChildren<useLuiModalPrefabProps> => ({
  style: { width: "480px", maxWidth: "480px" },
  level: "info",
  title: "Plan Generation Completed!",
  children:
    "The plan generation process has been successfully completed. " +
    `A plan compilation batch request has been logged, and will be run ${batchRunTime}. When the batch is completed, 
    a copy of the compiled Digital Survey Plan and Digital Title Plan will be sent to the surveyor and primary contact via online messaging.`,
  buttons: [
    {
      title: "Dismiss",
      value: undefined,
    },
  ],
});
