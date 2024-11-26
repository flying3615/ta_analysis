import "./ViewLabelTypes.scss";

import { LuiButton, LuiCheckboxInput } from "@linzjs/lui";
import { Panel, PanelContent, PanelHeader, PanelInstanceContext } from "@linzjs/windows";
import { useContext, useState } from "react";

import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { getViewableLabelTypes, setViewableLabelTypes } from "@/redux/planSheets/planSheetsSlice";

import { viewLabelTypeOptions } from "./properties/LabelPropertiesUtils";

export const ViewLabelTypes = () => {
  const currentViewableLabelTypes = useAppSelector(getViewableLabelTypes);
  const [selectedLabelTypes, setSelectedLabelTypes] = useState(currentViewableLabelTypes);
  const { panelClose } = useContext(PanelInstanceContext);

  const dispatch = useAppDispatch();

  const unsavedChanges =
    currentViewableLabelTypes.slice().sort().join(",") !== selectedLabelTypes.slice().sort().join(",");

  const allOptionsChecked =
    selectedLabelTypes.length === viewLabelTypeOptions.flatMap((option) => option.value.split(",")).length;

  const toggleViewableLabelTypeOption = (optionValue: string, checked: boolean) => {
    let newViewableLabelTypes = [...selectedLabelTypes];
    const labelTypes = optionValue.split(",");
    if (checked) {
      labelTypes.forEach((labelType) => newViewableLabelTypes.push(labelType));
    } else {
      newViewableLabelTypes = newViewableLabelTypes.filter((labelType) => !labelTypes.includes(labelType));
    }
    setSelectedLabelTypes(newViewableLabelTypes);
  };

  const toggleAllOption = (checked: boolean) => {
    if (checked) {
      setSelectedLabelTypes(viewLabelTypeOptions.flatMap((option) => option.value.split(",")));
    } else {
      setSelectedLabelTypes([]);
    }
  };

  return (
    <Panel
      modal={true}
      title="View labels"
      position="center"
      size={{ width: 320, height: 573 }}
      maxHeight="90%"
      className="view-label-types-panel"
    >
      <PanelHeader icon="ic_manage_labels" disablePopout={true} />
      <PanelContent>
        <LuiCheckboxInput
          label="All"
          value=""
          onChange={(e) => toggleAllOption(e.target.checked)}
          isIndeterminate={selectedLabelTypes.length !== 0 && !allOptionsChecked}
          isChecked={selectedLabelTypes.length !== 0}
        />
        {viewLabelTypeOptions.map((option, index) => {
          return (
            <LuiCheckboxInput
              label={option.label}
              value={option.value}
              key={index}
              onChange={(e) => toggleViewableLabelTypeOption(e.target.value, e.target.checked)}
              isChecked={option.value.split(",").some((v) => selectedLabelTypes.includes(v))}
            />
          );
        })}
      </PanelContent>
      <div className="footer">
        <LuiButton title="Cancel" level="secondary" onClick={() => panelClose()}>
          Cancel
        </LuiButton>
        <LuiButton
          title="OK"
          level="primary"
          onClick={() => {
            dispatch(setViewableLabelTypes(selectedLabelTypes));
            panelClose();
          }}
          disabled={!unsavedChanges}
        >
          OK
        </LuiButton>
      </div>
    </Panel>
  );
};
