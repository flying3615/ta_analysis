import { useLuiModalPrefabProps } from "@linzjs/windows";
import { PropsWithChildren } from "react";

export const layerChangesWillOverwriteModal: PropsWithChildren<useLuiModalPrefabProps<"overwrite">> = {
  level: "warning",
  title: "Message: 126034",
  children: (
    <>
      Any layer changes made to the individual user defined diagrams
      <br />
      will be overwritten if you continue. Do you wish to continue?
    </>
  ),
  buttons: [{ title: "Cancel" }, { title: "Overwrite", value: "overwrite", default: true }],
};
