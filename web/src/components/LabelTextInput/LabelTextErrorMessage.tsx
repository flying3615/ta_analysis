import { LuiIcon } from "@linzjs/lui";
import clsx from "clsx";

import {
  invalidCharactersErrorMessage,
  specialCharsRegex,
  textLengthLimit,
} from "@/components/PlanSheets/properties/LabelPropertiesUtils";

export const LabelTextErrorMessage = (props: {
  labelText: string;
  textLengthErrorMessage: string;
  className?: string;
}) => {
  return (
    <div className={clsx("LabelTextInput-error", props.className)}>
      <LuiIcon alt="error" name="ic_error" className="LabelTextInput-error-icon" size="sm" status="error" />
      <span>
        {specialCharsRegex.test(props.labelText)
          ? invalidCharactersErrorMessage
          : props.labelText.length > textLengthLimit
            ? props.textLengthErrorMessage
            : ""}
      </span>
    </div>
  );
};
