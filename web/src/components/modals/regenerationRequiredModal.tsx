import { useLuiModalPrefabProps } from "@linzjs/windows";
import { PropsWithChildren } from "react";

export const regenerationRequiredModal = (): PropsWithChildren<useLuiModalPrefabProps<boolean>> => ({
  level: "error",
  title: "Diagrams out of sync",
  className: "PlanSheets-regen-modal",
  children: (
    <>
      Survey data has been modified which could affect the plan content. The plan sheets must be regenerated and any
      changes since the last save will be lost.
    </>
  ),
  buttons: [{ title: "Regenerate plan sheets", value: true, level: "tertiary" }],
});
