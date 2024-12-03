import "./HiddenObjectsVisibleByDefault.scss";

import { LuiIcon, LuiMiniSpinner } from "@linzjs/lui";
import clsx from "clsx";
import { MouseEvent as ReactMouseEvent, ReactElement, useState } from "react";

import { useAppDispatch } from "@/hooks/reduxHooks";
import { setCanViewHiddenLabels } from "@/redux/planSheets/planSheetsSlice";

import { isHiddenObjectsVisibleByDefault, setHiddenObjectsVisibleByDefault } from "./labelPreferences";

export function HiddenObjectsVisibleByDefault(): ReactElement {
  const [isVisibleByDefault, _setIsVisibleByDefault] = useState(isHiddenObjectsVisibleByDefault());
  const [saving, setSaving] = useState(false);
  const dispatch = useAppDispatch();

  const setIsVisibleByDefault = (e: ReactMouseEvent<HTMLInputElement>) => {
    const isVisibleByDefault = e.currentTarget.checked;
    _setIsVisibleByDefault(isVisibleByDefault);
    setHiddenObjectsVisibleByDefault(isVisibleByDefault);
    dispatch(setCanViewHiddenLabels(isVisibleByDefault));
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <div
      className={clsx("LuiCheckboxInput HiddenObjectsVisibleByDefault", {
        "LuiCheckboxInput--isChecked": isVisibleByDefault,
      })}
    >
      <label className="HiddenObjectsVisibleByDefault__label" data-testid="hiddenObjectsVisibleByDefaultLabel">
        <input
          type="checkbox"
          className="LuiCheckboxInput-input"
          aria-checked={isVisibleByDefault}
          checked={isVisibleByDefault}
          onClick={setIsVisibleByDefault}
        />

        {saving && <LuiMiniSpinner size={18} divProps={{ className: "HiddenObjectsVisibleByDefault__spinner" }} />}
        {!saving && (
          <LuiIcon
            name="ic_check"
            className="LuiCheckboxInput-labelCheck HiddenObjectsVisibleByDefault__icon"
            alt="Hidden objects visible by default"
            size="sm"
          />
        )}

        <span className="LuiCheckboxInput-label">Hidden objects visible by default</span>
      </label>
    </div>
  );
}
