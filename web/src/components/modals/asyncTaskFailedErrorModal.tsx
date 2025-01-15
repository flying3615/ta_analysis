import "./asyncTaskFailedErrorModal.scss";

import { LuiAccordicard } from "@linzjs/lui";
import { useLuiModalPrefabProps } from "@linzjs/windows";
import { PropsWithChildren } from "react";

import { LINZ_CUSTOMER_SUPPORT_EMAIL, LINZ_CUSTOMER_SUPPORT_PHONE } from "@/constants";

export const asyncTaskFailedErrorModal = (
  title: string,
  exception?: string | false,
  exceptionMessage?: string | false,
): PropsWithChildren<useLuiModalPrefabProps<boolean>> => ({
  level: "error",
  title,
  className: "AsyncTaskFailedErrorModal",
  children: (
    <>
      <div>
        <div className="AsyncTaskFailedErrorModal-errorContent">
          <p className="AsyncTaskFailedErrorModal-errorContentText">
            Retry, or call us on&nbsp;
            <a href={`tel:${LINZ_CUSTOMER_SUPPORT_PHONE}`}>{LINZ_CUSTOMER_SUPPORT_PHONE}</a> or email&nbsp;
            <a href={`mailto:${LINZ_CUSTOMER_SUPPORT_EMAIL}`}>{LINZ_CUSTOMER_SUPPORT_EMAIL}</a> if it continues failing.
          </p>
          {exception && (
            <LuiAccordicard
              headerContent={
                <div>
                  <span>Detailed error information</span>
                </div>
              }
            >
              <div className="AsyncTaskFailedErrorModal-errorText">
                <h5>{exception}</h5>
                <pre>{exceptionMessage}</pre>
              </div>
            </LuiAccordicard>
          )}
        </div>
      </div>
    </>
  ),
  buttons: [
    { title: "Dismiss", value: false },
    { title: "Retry", value: true },
  ],
});
