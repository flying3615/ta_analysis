import { useLuiModalPrefabProps } from "@linzjs/windows";
import { PropsWithChildren } from "react";

import { LINZ_CUSTOMER_SUPPORT_EMAIL, LINZ_CUSTOMER_SUPPORT_PHONE } from "@/constants";

export const asyncTaskFailedErrorModal = (title: string): PropsWithChildren<useLuiModalPrefabProps<boolean>> => ({
  level: "error",
  title,
  children: (
    <>
      Retry, or call us on&nbsp;
      <a href={`tel:${LINZ_CUSTOMER_SUPPORT_PHONE}`}>{LINZ_CUSTOMER_SUPPORT_PHONE}</a> or email&nbsp;
      <a href={`mailto:${LINZ_CUSTOMER_SUPPORT_EMAIL}`}>{LINZ_CUSTOMER_SUPPORT_EMAIL}</a> if it continues failing.
    </>
  ),
  buttons: [
    { title: "Dismiss", value: false },
    { title: "Retry", value: true },
  ],
});
