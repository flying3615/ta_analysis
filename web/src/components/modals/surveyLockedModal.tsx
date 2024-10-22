import { useLuiModalPrefabProps } from "@linzjs/windows";
import { PropsWithChildren } from "react";

export const surveyLockCheckInProgressModal = {
  level: "progress",
  title: "Loading locks",
  children: `Checking lock permissions`,
  buttons: [],
} as PropsWithChildren<useLuiModalPrefabProps<boolean>>;

export const surveyLockedModal = (
  lockedByUser: string | undefined,
): PropsWithChildren<useLuiModalPrefabProps<boolean>> => ({
  style: { width: "480px" },
  level: "blocked",
  title: "Plan Generation locked",
  children: `This CSD is being used by ${lockedByUser ?? "Unknown"}.`,
  buttons: [
    {
      title: "Return to Survey Capture",
    },
  ],
});

export const failedToLoadLocksModal: PropsWithChildren<useLuiModalPrefabProps<boolean>> = {
  style: { width: "480px" },
  level: "blocked",
  title: "Failed to load locks",
  children: `An unknown error has prevented the locks from loading.`,
  buttons: [
    {
      title: "Return to Survey Capture",
    },
  ],
};
