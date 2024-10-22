import { DisplayStateEnum, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import { LuiButton, LuiButtonGroup, LuiCheckboxInput, LuiSelectInput, LuiTextInput } from "@linzjs/lui";
import { SelectOptions } from "@linzjs/lui/dist/components/LuiFormElements/LuiSelectInput/LuiSelectInput";
import clsx from "clsx";
import { uniq } from "lodash-es";
import React, { useState } from "react";

export interface LabelPropertiesProps {
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
}

const labelTypeOptions: SelectOptions[] = [
  { value: LabelDTOLabelTypeEnum.arcRadius, label: "Arc radius" },
  { value: LabelDTOLabelTypeEnum.childDiagram, label: "Child diagram" },
  { value: LabelDTOLabelTypeEnum.childDiagramPage, label: "Child diagram page" },
  { value: LabelDTOLabelTypeEnum.diagram, label: "Diagram" },
  { value: LabelDTOLabelTypeEnum.diagramType, label: "Diagram type" },
  { value: LabelDTOLabelTypeEnum.markDescription, label: "Mark description" },
  { value: LabelDTOLabelTypeEnum.markName, label: "Mark name" },
  { value: LabelDTOLabelTypeEnum.nodeSymbol1, label: "Node symbol 1" },
  { value: LabelDTOLabelTypeEnum.nodeSymbol2, label: "Node symbol 2" },
  { value: LabelDTOLabelTypeEnum.obsBearing, label: "Observation bearing" },
  { value: LabelDTOLabelTypeEnum.obsCode, label: "Observation code" },
  { value: LabelDTOLabelTypeEnum.obsDistance, label: "Observation distance" },
  { value: LabelDTOLabelTypeEnum.parcelAppellation, label: "Parcel appellation" },
  { value: LabelDTOLabelTypeEnum.parcelArea, label: "Parcel area" },
  { value: LabelDTOLabelTypeEnum.userAnnotation, label: "User annotation" },
  { value: LabelDTOLabelTypeEnum.lineDescription, label: "Line description" },
  { value: LabelDTOLabelTypeEnum.lineLongDescription, label: "Line long description" },
];

const fontOptions: SelectOptions[] = [
  { value: "Tahoma", label: "Tahoma" },
  { value: "Arial", label: "Arial" },
  { value: "Times New Roman", label: "Times New Roman" },
];

const fontSizeOptions: SelectOptions[] = [
  { value: "8", label: "8" },
  { value: "10", label: "10" },
  { value: "12", label: "12" },
  { value: "14", label: "14" },
  { value: "16", label: "16" },
];

const borderWidthOptions: SelectOptions[] = [
  { value: "0.7", label: "0.7" },
  { value: "1", label: "1" },
  { value: "1.4", label: "1.4" },
  { value: "2", label: "2" },
];

const getCommonPropertyValue = <T extends keyof LabelPropertiesProps>(
  arr: LabelPropertiesProps[],
  property: T,
): string | undefined => {
  const values = arr.map((item) => item[property]);
  const uniqueValues = uniq(values);
  return uniqueValues.length === 1 ? uniqueValues[0] : undefined;
};

const someButNotAllHavePropertyValue = <T extends keyof LabelPropertiesProps>(
  arr: LabelPropertiesProps[],
  property: T,
  value: string | undefined,
  checkIncludes?: boolean,
) => {
  let hasValue = false;
  let notAllHaveValue = false;
  if (checkIncludes && value) {
    hasValue = arr.some((obj) => obj[property]?.includes(value));
    notAllHaveValue = !arr.every((obj) => obj[property]?.includes(value));
  } else {
    hasValue = arr.some((obj) => obj[property] === value);
    notAllHaveValue = !arr.every((obj) => obj[property] === value);
  }
  return hasValue && notAllHaveValue;
};

const areAllPageLabels = (arr: LabelPropertiesProps[]) => {
  return arr.every((item) => item.diagramId === undefined);
};

const allHave00 = (arr: LabelPropertiesProps[]) => {
  return arr.every((item) => item.label.includes('00"'));
};

const anyHasDisplayState = (arr: LabelPropertiesProps[], displayStates: string[]) => {
  return arr.some((item) => displayStates.includes(item.displayState));
};

const LabelProperties = (props: { data: LabelPropertiesProps[] }) => {
  const labelType = getCommonPropertyValue(props.data, "labelType");
  const [displayState, setDisplayState] = useState<string | undefined>(
    getCommonPropertyValue(props.data, "displayState"),
  );
  const [isBold, setIsBold] = useState<boolean>();
  const [labelText, setLabelText] = useState<string | undefined>(getCommonPropertyValue(props.data, "label"));
  const [hide00, setHide00] = useState<boolean>(false);
  const [font, setFont] = useState<string | undefined>(getCommonPropertyValue(props.data, "font"));
  const [fontSize, setFontSize] = useState<string | undefined>(getCommonPropertyValue(props.data, "fontSize"));
  const [textRotation, setTextRotation] = useState<string | undefined>(
    getCommonPropertyValue(props.data, "textRotation"),
  );
  const [textRotationError, setTextRotationError] = useState<string>();
  const [justify, setJustify] = useState(1);
  const [hasBorder, setHasBorder] = useState<boolean>(props.data.some((item) => item.borderWidth !== undefined));
  const [borderWidth, setBorderWidth] = useState<string | undefined>(getCommonPropertyValue(props.data, "borderWidth"));

  const validateTextRotationInput = (value: string) => {
    const regex = /^[0-9]*\.?[0-9]*$/; // allows only decimal numbers
    !regex.test(value)
      ? setTextRotationError("Text rotation must be in decimal degrees")
      : setTextRotationError(undefined);
  };

  return (
    <div className="plan-element-properties">
      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Visibility</span>
        <div className="row">
          <span style={{ flex: "1 1 50%" }}>
            <LuiCheckboxInput
              // if any of the elements has displayState as systemHide or systemDisplay, disable the checkbox
              isDisabled={anyHasDisplayState(props.data, [DisplayStateEnum.systemHide, DisplayStateEnum.systemDisplay])}
              label="Hide"
              value=""
              onChange={(e) => {
                e.target.checked ? setDisplayState(DisplayStateEnum.hide) : setDisplayState(DisplayStateEnum.display);
              }}
              isIndeterminate={!displayState}
              isChecked={
                displayState === undefined
                  ? anyHasDisplayState(props.data, [DisplayStateEnum.systemHide, DisplayStateEnum.hide])
                  : displayState === DisplayStateEnum.hide
              }
            />
          </span>
          <span style={{ flex: "1 1 50%" }}>
            <LuiCheckboxInput
              // if any of the elements has the substring "bold" in fontStyle, but not all, show indeterminate state
              isIndeterminate={
                someButNotAllHavePropertyValue(props.data, "fontStyle", "bold", true) && isBold === undefined
              }
              label="Bold"
              value=""
              onChange={(e) => {
                setIsBold(e.target.checked);
              }}
              isChecked={isBold ?? props.data.some((item) => item.fontStyle?.includes("bold"))}
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
              <textarea
                disabled={!labelText || labelType !== LabelDTOLabelTypeEnum.userAnnotation || props.data.length > 1}
                value={props.data.length === 1 ? labelText : ""}
                onChange={(e) => {
                  setLabelText(e.target.value);
                }}
                className={clsx("PageLabelInput labelTextarea", { error: false })}
                data-testid="label-textarea"
              />
            )}
          </span>
          {labelType === LabelDTOLabelTypeEnum.obsBearing && (
            <span style={{ flex: "1 1 35%", marginLeft: "8px" }}>
              <LuiCheckboxInput
                label="Hide 00"
                value=""
                onChange={(e) => {
                  setHide00(e.target.checked);
                }}
                isChecked={hide00}
                isDisabled={labelType !== LabelDTOLabelTypeEnum.obsBearing || !allHave00(props.data)}
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
                setFont(e.target.value);
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
                setFontSize(e.target.value);
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
            validateTextRotationInput(e.target.value);
            setTextRotation(e.target.value);
          }}
          error={textRotationError}
        />
      </div>

      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Justify</span>
        <LuiButtonGroup>
          <LuiButton
            onClick={() => setJustify(1)}
            className={clsx(`lui-button lui-button-secondary`, justify === 1 ? `lui-button-active` : "")}
            disabled={!areAllPageLabels(props.data)}
          >
            Left
          </LuiButton>
          <LuiButton
            onClick={() => setJustify(2)}
            className={clsx(`lui-button lui-button-secondary`, justify === 2 ? `lui-button-active` : "")}
            disabled={!areAllPageLabels(props.data)}
          >
            Center
          </LuiButton>
          <LuiButton
            onClick={() => setJustify(3)}
            className={clsx(`lui-button lui-button-secondary`, justify === 3 ? `lui-button-active` : "")}
            disabled={!areAllPageLabels(props.data)}
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
                someButNotAllHavePropertyValue(props.data, "borderWidth", undefined) && borderWidth === undefined
              }
              label="Border"
              value=""
              onChange={(e) => {
                setHasBorder(e.target.checked);
                e.target.checked ? setBorderWidth("0.7") : setBorderWidth(undefined);
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
                setBorderWidth(e.target.value);
              }}
            />
          </span>
        </div>
      </div>
    </div>
  );
};

export default LabelProperties;
