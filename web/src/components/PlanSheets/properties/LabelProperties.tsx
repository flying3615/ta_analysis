import { DisplayStateEnum, LabelDTO, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import { LuiButton, LuiButtonGroup, LuiCheckboxInput, LuiSelectInput, LuiTextInput } from "@linzjs/lui";
import clsx from "clsx";
import React, { useCallback, useEffect, useState } from "react";

import { LabelTextErrorMessage } from "@/components/PageLabelInput/LabelTextErrorMessage";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { updateDiagramLabels, updatePageLabels } from "@/modules/plan/updatePlanData";
import { getActivePage, getDiagrams, replaceDiagrams, replacePage } from "@/redux/planSheets/planSheetsSlice";

import {
  allHave00,
  anyHasDisplayState,
  areAllPageLabels,
  borderWidthOptions,
  createLabelPropsToBeSaved,
  fontOptions,
  fontSizeOptions,
  getCommonPropertyValue,
  getTextLengthErrorMessage,
  labelTypeOptions,
  someButNotAllHavePropertyValue,
  specialCharsRegex,
  textLengthLimit,
} from "./LabelPropertiesUtils";

interface LabelPropertiesProps {
  data: LabelPropertiesData[];
  setSaveFunction: React.Dispatch<React.SetStateAction<(() => void) | undefined>>;
  setSaveEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface LabelPropertiesData {
  id: string;
  displayState: string;
  labelType: LabelDTOLabelTypeEnum;
  fontStyle: string | undefined;
  label: string;
  font: string;
  fontSize: string;
  textRotation: string;
  borderWidth: string | undefined;
  textAlignment: string;
  diagramId: string | undefined;
  elementType: PlanElementType;
}

export type PanelValuesToUpdate = {
  displayState?: string;
  isBold?: boolean;
  labelText?: string;
  hide00?: boolean;
  font?: string;
  fontSize?: string;
  textRotation?: string;
  justify?: string;
  hasBorder?: boolean;
  borderWidth?: string;
};

export type LabelPropsToUpdate = Pick<LabelDTO, "id"> & Partial<LabelDTO>;
export type LabelElementTypeProps = { elementType?: PlanElementType; diagramId?: string };
export type LabelPropsToUpdateWithElemType = { data: LabelPropsToUpdate; type: LabelElementTypeProps };

const LabelProperties = (props: LabelPropertiesProps) => {
  const selectedLabels = props.data;

  const dispatch = useAppDispatch();
  const activePage = useAppSelector(getActivePage);
  const diagrams = useAppSelector(getDiagrams);
  const [panelValuesToUpdate, setPanelValuesToUpdate] = useState<PanelValuesToUpdate>();

  // Save function
  const save = useCallback(() => {
    if (!activePage || !panelValuesToUpdate) return;

    const labelsToUpdate: LabelPropsToUpdate[] = selectedLabels.map((label) =>
      createLabelPropsToBeSaved(panelValuesToUpdate, label),
    );

    // Update page labels
    const pageLabelsToUpdate = labelsToUpdate.filter((label) =>
      selectedLabels.some(
        (selectedLabel) => selectedLabel.id === label.id.toString() && selectedLabel.diagramId === undefined,
      ),
    );
    dispatch(replacePage(updatePageLabels(activePage, pageLabelsToUpdate)));

    // Update diagram labels
    const diagramLabelsToUpdate = labelsToUpdate.filter((label) => !pageLabelsToUpdate.includes(label));
    const diagramLabelsToUpdateWithElemType: LabelPropsToUpdateWithElemType[] = diagramLabelsToUpdate.map((label) => {
      const selectedLabel = selectedLabels.find((selected) => selected.id === label.id.toString());
      return {
        data: label,
        type: {
          elementType: selectedLabel?.elementType,
          diagramId: selectedLabel?.diagramId,
        },
      };
    });
    dispatch(replaceDiagrams(updateDiagramLabels(diagrams, diagramLabelsToUpdateWithElemType)));
  }, [panelValuesToUpdate, activePage, diagrams, selectedLabels, dispatch]);

  useEffect(() => {
    props.setSaveFunction(() => save);
  }, [props, save]);

  useEffect(() => {
    panelValuesToUpdate && props.setSaveEnabled(true);
  }, [panelValuesToUpdate, props]);

  // declare state variables
  const labelType = getCommonPropertyValue(selectedLabels, "labelType");
  const [displayState, setDisplayState] = useState<string | undefined>(
    getCommonPropertyValue(selectedLabels, "displayState"),
  );
  const [isBold, setIsBold] = useState<boolean>();
  const [labelText, setLabelText] = useState<string | undefined>(getCommonPropertyValue(selectedLabels, "label"));
  const [hide00, setHide00] = useState<boolean>(false);
  const [font, setFont] = useState<string | undefined>(getCommonPropertyValue(selectedLabels, "font"));
  const [fontSize, setFontSize] = useState<string | undefined>(getCommonPropertyValue(selectedLabels, "fontSize"));
  const [textRotation, setTextRotation] = useState<string | undefined>(
    getCommonPropertyValue(selectedLabels, "textRotation"),
  );
  const [textRotationError, setTextRotationError] = useState<string>();
  const [justify, setJustify] = useState(1);
  const [hasBorder, setHasBorder] = useState<boolean>(selectedLabels.some((item) => item.borderWidth !== undefined));
  const [borderWidth, setBorderWidth] = useState<string | undefined>(
    getCommonPropertyValue(selectedLabels, "borderWidth"),
  );

  const validateTextRotationInput = (value: string) => {
    const regex = /^[0-9]*\.?[0-9]*$/; // allows only decimal numbers
    !regex.test(value)
      ? setTextRotationError("Text rotation must be in decimal degrees")
      : setTextRotationError(undefined);
  };

  const textLengthErrorMessage = labelText ? getTextLengthErrorMessage(labelText.length - textLengthLimit) : "";
  const hasError = labelText && (labelText.length > textLengthLimit || specialCharsRegex.test(labelText));

  return (
    <div className="plan-element-properties">
      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Visibility</span>
        <div className="row">
          <span style={{ flex: "1 1 50%" }}>
            <LuiCheckboxInput
              // if any of the elements has displayState as systemHide or systemDisplay, disable the checkbox
              isDisabled={anyHasDisplayState(selectedLabels, [
                DisplayStateEnum.systemHide,
                DisplayStateEnum.systemDisplay,
              ])}
              label="Hide"
              value=""
              onChange={(e) => {
                const isChecked = e.target.checked;
                const newValue = isChecked ? DisplayStateEnum.hide : DisplayStateEnum.display;
                setDisplayState(newValue);
                setPanelValuesToUpdate({ ...panelValuesToUpdate, displayState: newValue });
              }}
              isIndeterminate={!displayState}
              isChecked={
                displayState === undefined
                  ? anyHasDisplayState(selectedLabels, [DisplayStateEnum.systemHide, DisplayStateEnum.hide])
                  : displayState === DisplayStateEnum.hide
              }
            />
          </span>
          <span style={{ flex: "1 1 50%" }}>
            <LuiCheckboxInput
              // if any of the elements has the substring "bold" in fontStyle, but not all, show indeterminate state
              isIndeterminate={
                someButNotAllHavePropertyValue(selectedLabels, "fontStyle", "bold", true) && isBold === undefined
              }
              label="Bold"
              value=""
              onChange={(e) => {
                const isChecked = e.target.checked;
                setIsBold(isChecked);
                setPanelValuesToUpdate({ ...panelValuesToUpdate, isBold: isChecked });
              }}
              isChecked={isBold ?? selectedLabels.some((item) => item.fontStyle?.includes("bold"))}
            />
          </span>
        </div>
      </div>

      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Type</span>
        <LuiTextInput
          label=""
          hideLabel
          value={labelTypeOptions.find((option) => option.value === labelType)?.label}
          inputProps={{ disabled: true }}
        />
      </div>

      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Text</span>
        <div className="row">
          <span style={{ flex: `${labelType === LabelDTOLabelTypeEnum.obsBearing ? "1 1 65%" : "1 1 100%"}` }}>
            {labelType === LabelDTOLabelTypeEnum.obsBearing ? (
              <div data-testid="label-text-input">
                <LuiTextInput
                  label=""
                  hideLabel
                  value={props.data.length === 1 ? labelText : ""}
                  inputProps={{ disabled: true }}
                />
              </div>
            ) : (
              <div>
                <textarea
                  disabled={!labelText || labelType !== LabelDTOLabelTypeEnum.userAnnotation || props.data.length > 1}
                  value={props.data.length === 1 ? labelText : ""}
                  onChange={(e) => {
                    setLabelText(e.target.value);
                  }}
                  className={clsx("PageLabelInput labelTextarea", { error: hasError })}
                  data-testid="label-textarea"
                />
                {hasError && (
                  <LabelTextErrorMessage
                    labelText={labelText}
                    textLengthErrorMessage={textLengthErrorMessage}
                    className="errorMessage"
                  />
                )}
              </div>
            )}
          </span>
          {labelType === LabelDTOLabelTypeEnum.obsBearing && (
            <span style={{ flex: "1 1 35%", marginLeft: "8px" }}>
              <LuiCheckboxInput
                label="Hide 00"
                value=""
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setHide00(newValue);
                  setPanelValuesToUpdate({ ...panelValuesToUpdate, hide00: newValue });
                }}
                isChecked={hide00}
                isDisabled={labelType !== LabelDTOLabelTypeEnum.obsBearing || !allHave00(selectedLabels)}
              />
            </span>
          )}
        </div>
      </div>

      <div className="property-wrap">
        <div className="row">
          <span style={{ flex: "1 1 70%" }}>
            <span className="LuiTextInput-label-text">Font</span>
            <LuiSelectInput
              label=""
              hideLabel
              placeholderText=" "
              options={fontOptions}
              value={font ?? ""}
              onChange={(e) => {
                const newValue = e.target.value;
                setFont(newValue);
                setPanelValuesToUpdate({ ...panelValuesToUpdate, font: newValue });
              }}
            />
          </span>
          <span style={{ flex: "1 1 30%", marginLeft: "8px" }}>
            <span className="LuiTextInput-label-text">Size(pts)</span>
            <LuiSelectInput
              label=""
              hideLabel
              placeholderText=" "
              options={fontSizeOptions}
              value={fontSize ?? ""}
              onChange={(e) => {
                const newValue = e.target.value;
                setFontSize(newValue);
                setPanelValuesToUpdate({ ...panelValuesToUpdate, fontSize: newValue });
              }}
            />
          </span>
        </div>
      </div>

      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Text angle (degrees)</span>
        <LuiTextInput
          label=""
          hideLabel
          value={textRotation}
          onChange={(e) => {
            const newValue = e.target.value;
            validateTextRotationInput(newValue);
            setTextRotation(newValue);
            setPanelValuesToUpdate({ ...panelValuesToUpdate, textRotation: newValue });
          }}
          error={textRotationError}
        />
      </div>

      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Justify</span>
        <LuiButtonGroup>
          <LuiButton
            onClick={() => {
              setJustify(1);
              setPanelValuesToUpdate({ ...panelValuesToUpdate, justify: "left" });
            }}
            className={clsx(`lui-button lui-button-secondary`, justify === 1 ? `lui-button-active` : "")}
            disabled={!areAllPageLabels(selectedLabels)}
          >
            Left
          </LuiButton>
          <LuiButton
            onClick={() => {
              setJustify(2);
              setPanelValuesToUpdate({ ...panelValuesToUpdate, justify: "center" });
            }}
            className={clsx(`lui-button lui-button-secondary`, justify === 2 ? `lui-button-active` : "")}
            disabled={!areAllPageLabels(selectedLabels)}
          >
            Center
          </LuiButton>
          <LuiButton
            onClick={() => {
              setJustify(3);
              setPanelValuesToUpdate({ ...panelValuesToUpdate, justify: "right" });
            }}
            className={clsx(`lui-button lui-button-secondary`, justify === 3 ? `lui-button-active` : "")}
            disabled={!areAllPageLabels(selectedLabels)}
          >
            Right
          </LuiButton>
        </LuiButtonGroup>
      </div>

      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Border (pts)</span>
        <div className="row">
          <span style={{ flex: "1 1 30%" }}>
            <LuiCheckboxInput
              //if any of the elements has borderWidth undefined, but not all, show indeterminate state
              isIndeterminate={
                someButNotAllHavePropertyValue(selectedLabels, "borderWidth", undefined) && borderWidth === undefined
              }
              label="Border"
              value=""
              onChange={(e) => {
                const isChecked = e.target.checked;
                const newValue = isChecked ? "0.7" : undefined;
                setHasBorder(isChecked);
                setBorderWidth(newValue);
                setPanelValuesToUpdate({ ...panelValuesToUpdate, hasBorder: isChecked, borderWidth: newValue });
              }}
              isChecked={hasBorder}
            />
          </span>
          <span style={{ flex: "1 1 70%", marginLeft: "8px" }}>
            <LuiSelectInput
              label=""
              hideLabel
              placeholderText=" "
              options={borderWidthOptions}
              selectProps={{ disabled: !hasBorder }}
              value={borderWidth ?? ""}
              onChange={(e) => {
                const newValue = e.target.value;
                setBorderWidth(newValue);
                setPanelValuesToUpdate({ ...panelValuesToUpdate, borderWidth: newValue });
              }}
            />
          </span>
        </div>
      </div>
    </div>
  );
};

export default LabelProperties;
