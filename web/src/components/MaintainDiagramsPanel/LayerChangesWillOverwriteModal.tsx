import { useLuiModalPrefabProps } from "@linzjs/windows";
import { PropsWithChildren } from "react";

export const layerChangesWillOverwriteModal: PropsWithChildren<useLuiModalPrefabProps<"continue">> = {
  level: "warning",
  title: "Message: 126034",
  children: (
    <>
      Any layer changes made to an individual user defined
      <br />
      diagram of this diagram type will be overwritten.
    </>
  ),
  buttons: [{ title: "Cancel" }, { title: "Continue", value: "continue", default: true }],
};
