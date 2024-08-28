import { useLuiModalPrefabProps } from "@linzjs/windows";
import { PropsWithChildren } from "react";

import { ErrorWithResponse } from "@/components/modals/unhandledErrorModal.tsx";

export const errorWithResponseModal = (
  error: ErrorWithResponse,
): PropsWithChildren<useLuiModalPrefabProps<boolean>> => ({
  level: "error",
  title: error.message ?? "Error",
  children: (
    <>
      {error.response?.status}:&nbsp;{error.response?.statusText ?? error.message}
    </>
  ),
  buttons: [{ title: "Dismiss", value: true }],
});
