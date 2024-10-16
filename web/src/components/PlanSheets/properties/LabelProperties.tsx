import { DisplayStateEnum, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import { LuiButton, LuiButtonGroup, LuiCheckboxInput, LuiSelectInput, LuiTextInput } from "@linzjs/lui";
import { SelectOptions } from "@linzjs/lui/dist/components/LuiFormElements/LuiSelectInput/LuiSelectInput";
import clsx from "clsx";
import React, { useState } from "react";

export interface LabelPropertiesProps {
  displayState: string;
  labelType: LabelDTOLabelTypeEnum;
  fontStyle: string;
  label: string;
  font: string;
  fontSize: string;
  textRotation: string;
  borderWidth: string | undefined;
  textAlignment: string;
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

const LabelProperties = (props: LabelPropertiesProps) => {
  const [displayState, setDisplayState] = useState<string>(props.displayState);
  const [fontStyle, setFontStyle] = useState<string>(props.fontStyle);
  const [labelText, setLabelText] = useState<string>(props.label);
  const [hide00, setHide00] = useState<boolean>(false);
  const [font, setFont] = useState<string>(props.font);
  const [fontSize, setFontSize] = useState<string>(props.fontSize);
  const [textRotation, setTextRotation] = useState<string>(props.textRotation);
  const [textRotationError, setTextRotationError] = useState<string>();
  const [selectJustify, setSelectJustify] = useState(1);
  const [borderWidth, setBorderWidth] = useState<string | undefined>(props.borderWidth);

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
              isDisabled={([DisplayStateEnum.systemHide, DisplayStateEnum.systemDisplay] as string[]).includes(
                displayState,
              )}
              label="Hide"
              value=""
              onChange={(e) => {
                e.target.checked ? setDisplayState(DisplayStateEnum.hide) : setDisplayState(DisplayStateEnum.display);
              }}
              isChecked={([DisplayStateEnum.hide, DisplayStateEnum.systemHide] as string[]).includes(displayState)}
            />
          </span>
          <span style={{ flex: "1 1 50%" }}>
            <LuiCheckboxInput
              label="Bold"
              value=""
              onChange={(e) => {
                const newFontStyle = e.target.checked
                  ? props.fontStyle === "italic"
                    ? "boldItalic"
                    : "bold"
                  : props.fontStyle === "boldItalic"
                    ? "italic"
                    : "regular";
                setFontStyle(newFontStyle);
              }}
              isChecked={["boldItalic", "bold"].includes(fontStyle)}
            />
          </span>
        </div>
      </div>

      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Type</span>
        <LuiTextInput
          label=""
          hideLabel
          value={labelTypeOptions.find((option) => option.value === props.labelType)?.label}
          inputProps={{ disabled: true }}
        />
      </div>

      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Text</span>
        <div className="row">
          <span style={{ flex: "1 1 70%" }}>
            <LuiTextInput
              label=""
              hideLabel
              value={labelText}
              onChange={(e) => {
                setLabelText(e.target.value);
              }}
            />
          </span>
          <span style={{ flex: "1 1 30%", marginLeft: "8px" }}>
            <LuiCheckboxInput
              label="Hide 00"
              value=""
              onChange={(e) => {
                setHide00(e.target.checked);
              }}
              isChecked={hide00}
            />
          </span>
        </div>
      </div>

      <div className="property-wrap">
        <div className="row">
          <span style={{ flex: "1 1 70%" }}>
            <span className="LuiTextInput-label-text">Font</span>
            <LuiSelectInput
              label=""
              hideLabel
              options={fontOptions}
              value={font}
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
              options={fontSizeOptions}
              value={fontSize}
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
            onClick={() => setSelectJustify(1)}
            className={clsx(`lui-button lui-button-secondary`, selectJustify === 1 ? `lui-button-active` : "")}
          >
            Left
          </LuiButton>
          <LuiButton
            onClick={() => setSelectJustify(2)}
            className={clsx(`lui-button lui-button-secondary`, selectJustify === 2 ? `lui-button-active` : "")}
          >
            Center
          </LuiButton>
          <LuiButton
            onClick={() => setSelectJustify(3)}
            className={clsx(`lui-button lui-button-secondary`, selectJustify === 3 ? `lui-button-active` : "")}
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
              label="Border"
              value=""
              onChange={(e) => {
                e.target.checked ? setBorderWidth("0.7") : setBorderWidth(undefined);
              }}
              isChecked={!!borderWidth}
            />
          </span>
          <span style={{ flex: "1 1 70%", marginLeft: "8px" }}>
            <LuiSelectInput
              label=""
              hideLabel
              options={borderWidthOptions}
              selectProps={{ disabled: !borderWidth }}
              value={fontSize}
              onChange={(e) => {
                setFontSize(e.target.value);
              }}
            />
          </span>
        </div>
      </div>
    </div>
  );
};

export default LabelProperties;
