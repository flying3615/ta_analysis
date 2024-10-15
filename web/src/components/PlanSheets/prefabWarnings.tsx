import { useLuiModalPrefabProps } from "@linzjs/windows";
import { PropsWithChildren } from "react";

export const warning126024_planGenHasRunBefore: PropsWithChildren<useLuiModalPrefabProps<boolean>> = {
  style: { width: "480px", maxWidth: "480px" },
  level: "warning",
  title: "Complete Plan Generation",
  children:
    "A full set of digital plans have already been generated for this survey. The existing digital plans will now be replaced based on your current diagram layout, attached supporting documents and survey header information. This may take some time. Do you wish to continue?",
  buttons: [
    { title: "No" },
    {
      title: "Yes",
      value: true,
    },
  ],
};
