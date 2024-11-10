import "./HiddenObjectsVisibleByDefault.scss";

import { LuiCheckboxInput } from "@linzjs/lui";
import { ChangeEvent, ReactElement, useCallback, useState } from "react";

import { isHiddenObjectsVisibleByDefault, setHiddenObjectsVisibleByDefault } from "./labelPreferences";

export function HiddenObjectsVisibleByDefault(): ReactElement {
  const [isVisibleByDefault, _setIsVisibleByDefault] = useState(isHiddenObjectsVisibleByDefault());

  const setIsVisibleByDefault = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const isVisibleByDefault = e.target.checked;
      _setIsVisibleByDefault(isVisibleByDefault);
      setHiddenObjectsVisibleByDefault(isVisibleByDefault);
    },
    [_setIsVisibleByDefault],
  );

  return (
    <LuiCheckboxInput
      className="HiddenObjectsVisibleByDefault"
      label="Hidden objects visible by default"
      value=""
      onChange={setIsVisibleByDefault}
      isChecked={isVisibleByDefault}
    />
  );
}
