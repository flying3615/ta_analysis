import { LuiIcon } from "@linzjs/lui";
import clsx from "clsx";

/**
 * @param props infomessage is provided by LabelPropertiesUtils.lineBreakRestrictedInfoMessages according to LineType
 * @constructor
 */
export const LabelTextInfoMessage = (props: { infoMessage: string; className?: string }) => {
  return (
    <div className={clsx("LabelTextInput-info", props.className)}>
      <LuiIcon alt="error" name="ic_info" className="LabelTextInput-info-icon" size="sm" status="interactive" />
      <span>{props.infoMessage}</span>
    </div>
  );
};
