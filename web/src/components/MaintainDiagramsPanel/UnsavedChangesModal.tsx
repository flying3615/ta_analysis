import { useLuiModalPrefabProps } from "@linzjs/windows";
import { PropsWithChildren } from "react";

export const unsavedChangesModal: PropsWithChildren<useLuiModalPrefabProps<"discard" | "save">> = {
  level: "warning",
  title: "Unsaved changes",
  children: <>What would you like to do with your unsaved changes?</>,
  buttons: [
    { title: "Cancel" },
    { title: "Discard", value: "discard" },
    { title: "Save", value: "save", default: true },
  ],
};
