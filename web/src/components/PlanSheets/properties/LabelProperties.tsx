import { DisplayStateEnum, LabelDTO, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import { LuiButton, LuiButtonGroup, LuiCheckboxInput, LuiIcon, LuiSelectInput, LuiTextInput } from "@linzjs/lui";
import clsx from "clsx";
import { isEmpty, isNil } from "lodash-es";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { LabelTextErrorMessage } from "@/components/PageLabelInput/LabelTextErrorMessage";
import { PlanElementType } from "@/components/PlanSheets/PlanElementType";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import { updateDiagramLabels, updatePageLabels } from "@/modules/plan/updatePlanData";
import { getActivePage, replaceDiagrams, replacePage } from "@/redux/planSheets/planSheetsSlice";
import { convertDegreesToDms, convertDmsToDegrees, paddingMMSS } from "@/util/stringUtil";

import {
  allHave00,
  ANGLE_REGEXP_DMS,
  ANGLE_REGEXP_DMS_PATTERN,
  angleExceedErrorMessage,
  angleFormatErrorMessage,
  anyHasDisplayState,
  areAllPageLabels,
  borderWidthOptions,
  createLabelPropsToBeSaved,
  cytoscapeLabelIdToPlanData,
  fontOptions,
  fontSizeOptions,
  getCommonPropertyValue,
  getTextAlignmentValues,
  getTextLengthErrorMessage,
  labelTypeOptions,
  planDataLabelIdToCytoscape,
  someButNotAllHavePropertyValue,
  specialCharsRegex,
  textAlignmentEnum,
  textLengthLimit,
} from "./LabelPropertiesUtils";

interface LabelPropertiesProps {
  data: LabelPropertiesData[];
  setSaveFunction: React.Dispatch<React.SetStateAction<(() => void) | undefined>>;
  setSaveEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface LabelPropertiesData {
  id: string; // cytoscape ID ('LAB_')
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
  displayFormat: string | undefined;
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

// id is plandata
export type LabelPropsToUpdate = Pick<LabelDTO, "id"> & Partial<LabelDTO>;
export type LabelElementTypeProps = { elementType?: PlanElementType; diagramId?: string };
export type LabelPropsToUpdateWithElemType = { data: LabelPropsToUpdate; type: LabelElementTypeProps };

const LabelProperties = (props: LabelPropertiesProps) => {
  const dispatch = useAppDispatch();
  const activePage = useAppSelector(getActivePage);
  const activeDiagrams = useAppSelector(selectActiveDiagrams);

  const selectedLabels = useMemo(() => {
    // load the selected labels from redux store
    return props.data.map((label) => {
      const pageLabel = activePage?.labels?.find((pageLabel) => pageLabel.id === cytoscapeLabelIdToPlanData(label.id));
      const diagram = activeDiagrams.find((diagram) => diagram.id === Number(label.diagramId));

      const diagramLabel = diagram?.labels.find(
        (diagramLabel) => diagramLabel.id === cytoscapeLabelIdToPlanData(label.id),
      );
      const coordinateLabel = diagram?.coordinateLabels.find(
        (coordinateLabel) => coordinateLabel.id === cytoscapeLabelIdToPlanData(label.id),
      );
      const lineLabel = diagram?.lineLabels.find((lineLabel) => lineLabel.id === cytoscapeLabelIdToPlanData(label.id));
      const parcelLabel = diagram?.parcelLabelGroups
        ?.flatMap((parcelLabelGroup) => parcelLabelGroup.labels)
        .find((coordinateLabel) => coordinateLabel.id === cytoscapeLabelIdToPlanData(label.id));

      const childDiagramLabel = diagram?.childDiagrams
        ?.flatMap((cd) => cd.labels)
        .find((diagramLabel) => diagramLabel.id === cytoscapeLabelIdToPlanData(label.id));

      const selectedLabel =
        pageLabel ?? diagramLabel ?? coordinateLabel ?? lineLabel ?? parcelLabel ?? childDiagramLabel;

      return {
        ...label,
        displayState: selectedLabel?.displayState ?? label.displayState,
        fontStyle: selectedLabel?.fontStyle ?? label.fontStyle,
        label: selectedLabel?.displayText ?? label.label,
        font: selectedLabel?.font ?? label.font,
        fontSize: `${selectedLabel?.fontSize ?? label.fontSize}`,
        textRotation: `${selectedLabel?.rotationAngle ?? label.textRotation}`,
        borderWidth: selectedLabel?.borderWidth ?? label.borderWidth,
        textAlignment: selectedLabel?.textAlignment ?? label.textAlignment,
        displayFormat: selectedLabel?.displayFormat ?? label.displayFormat,
      } as LabelPropertiesData;
    });
  }, [props.data, activePage, activeDiagrams]);

  const [panelValuesToUpdate, setPanelValuesToUpdate] = useState<PanelValuesToUpdate>();

  // Save function
  const save = useCallback(() => {
    if (!activePage || !panelValuesToUpdate) return;

    const labelsToUpdate: LabelPropsToUpdate[] = selectedLabels.map((label) =>
      createLabelPropsToBeSaved(panelValuesToUpdate, label),
    );

    // Update diagram labels
    const diagramLabelsToUpdate = labelsToUpdate.filter((label) =>
      selectedLabels.some(
        (selectedLabel) => selectedLabel.id === planDataLabelIdToCytoscape(label.id) && !isNil(selectedLabel.diagramId),
      ),
    );
    const diagramLabelsToUpdateWithElemType: LabelPropsToUpdateWithElemType[] = diagramLabelsToUpdate.map((label) => {
      const selectedLabel = selectedLabels.find((selected) => selected.id === planDataLabelIdToCytoscape(label.id));
      return {
        data: label,
        type: {
          elementType: selectedLabel?.elementType,
          diagramId: selectedLabel?.diagramId,
        },
      };
    });

    dispatch(replaceDiagrams(updateDiagramLabels(activeDiagrams, diagramLabelsToUpdateWithElemType)));

    // Update page labels (do not apply onDataChanging as it is already done in replaceDiagrams, so the undo button works correctly)
    const pageLabelsToUpdate = labelsToUpdate.filter((label) => !diagramLabelsToUpdate.includes(label));
    dispatch(
      replacePage({ updatedPage: updatePageLabels(activePage, pageLabelsToUpdate), applyOnDataChanging: false }),
    );
  }, [panelValuesToUpdate, activePage, activeDiagrams, selectedLabels, dispatch]);

  /** Normalize the angle to be within 0-180 in DMS */
  const normalizeLabelAngle = (angle: string | undefined): string => {
    if (isNaN(Number(angle))) return "";
    const angleValue = Number(angle);
    const normalizedAngle = angleValue <= 90 ? 90 - angleValue : 90 - angleValue + 360;
    return convertDegreesToDms(normalizedAngle);
  };

  /** Reverse operate of normalizeLabelAngle in degree */
  const denormalizeLabelAngle = (dms: number): number => {
    const angle = convertDmsToDegrees(Number(dms));
    return angle <= 90 ? 90 - angle : 90 - angle + 360;
  };

  useEffect(() => {
    props.setSaveFunction(() => save);
  }, [props, save]);

  // declare state variables
  const labelType = getCommonPropertyValue(selectedLabels, "labelType");
  const [displayState, setDisplayState] = useState<string | undefined>(
    getCommonPropertyValue(selectedLabels, "displayState"),
  );
  const [isBold, setIsBold] = useState<boolean>();
  const [hasLabelTextError, setHasLabelTextError] = useState<boolean>();
  const [textRotationErrorMsg, setTextRotationErrorMsg] = useState<string | undefined>();
  const [labelText, setLabelText] = useState<string | undefined>(getCommonPropertyValue(selectedLabels, "label"));
  const [hide00, setHide00] = useState<boolean>();
  const [font, setFont] = useState<string | undefined>(getCommonPropertyValue(selectedLabels, "font"));
  const [fontSize, setFontSize] = useState<string | undefined>(getCommonPropertyValue(selectedLabels, "fontSize"));
  const [textRotation, setTextRotation] = useState<string | undefined>(
    normalizeLabelAngle(getCommonPropertyValue(selectedLabels, "textRotation")),
  );
  const textAlignemntValues = getTextAlignmentValues(selectedLabels);
  const [justify, setJustify] = useState(
    isEmpty(textAlignemntValues) || isNil(textAlignemntValues[0])
      ? 1 // if no textAlignemtValues, default to left
      : textAlignmentEnum[textAlignemntValues[0] as keyof typeof textAlignmentEnum],
  );
  const [hasBorder, setHasBorder] = useState<boolean>(selectedLabels.some((item) => item.borderWidth !== undefined));
  const [borderWidth, setBorderWidth] = useState<string | undefined>(
    getCommonPropertyValue(selectedLabels, "borderWidth"),
  );

  const textLengthErrorMessage = labelText ? getTextLengthErrorMessage(labelText.length - textLengthLimit) : "";

  useEffect(() => {
    const hasLabelTextError = !!(
      labelText &&
      (labelText.length > textLengthLimit || specialCharsRegex.test(labelText))
    );
    setHasLabelTextError(hasLabelTextError);

    if (Number(textRotation) < 0 || Number(textRotation) > 180) {
      setTextRotationErrorMsg(angleExceedErrorMessage);
    } else if (textRotation && !ANGLE_REGEXP_DMS_PATTERN.test(paddingMMSS(textRotation))) {
      setTextRotationErrorMsg(angleFormatErrorMessage);
    } else {
      setTextRotationErrorMsg(undefined);
    }

    const hasError = hasLabelTextError || textRotationErrorMsg;

    if (hasError) {
      props.setSaveEnabled(false);
    } else {
      panelValuesToUpdate && props.setSaveEnabled(true);
    }
  }, [textRotationErrorMsg, labelText, panelValuesToUpdate, props, textRotation]);

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
                    const newValue = e.target.value;
                    setLabelText(newValue);
                    setPanelValuesToUpdate({ ...panelValuesToUpdate, labelText: newValue });
                  }}
                  className={clsx("PageLabelInput labelTextarea", { error: hasLabelTextError })}
                  data-testid="label-textarea"
                />
                {hasLabelTextError && (
                  <LabelTextErrorMessage
                    labelText={labelText ?? ""}
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
                // if any of the elements has displayFormat "suppressSeconds", but not all, show indeterminate state
                isIndeterminate={
                  someButNotAllHavePropertyValue(selectedLabels, "displayFormat", "suppressSeconds") &&
                  hide00 === undefined
                }
                label="Hide 00"
                value=""
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setHide00(newValue);
                  setPanelValuesToUpdate({ ...panelValuesToUpdate, hide00: newValue });
                }}
                isChecked={hide00 ?? selectedLabels.some((item) => item.displayFormat?.includes("suppressSeconds"))}
                isDisabled={!allHave00(selectedLabels)}
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
        <div className="text-angle-input">
          <span className="LuiTextInput-label-text">Text angle (degrees)</span>
          <LuiTextInput
            inputProps={{
              type: "number",
              min: "0",
              max: "180",
              step: "0.0001",
              pattern: ANGLE_REGEXP_DMS,
            }}
            label=""
            hideLabel
            value={`${textRotation}`}
            onChange={(e) => {
              const newValue = e.target.value;
              setTextRotation(newValue);
              // change dms value to degree to update
              setPanelValuesToUpdate({
                ...panelValuesToUpdate,
                textRotation: `${denormalizeLabelAngle(Number(newValue))}`,
              });
            }}
          />
          {textRotationErrorMsg && (
            <div className={clsx("PageLabelTextAngleInput-error")}>
              <LuiIcon alt="error" name="ic_error" className="PageLabelInput-error-icon" size="sm" status="error" />
              <span>{textRotationErrorMsg}</span>
            </div>
          )}
        </div>
      </div>

      <div className="property-wrap">
        <span className="LuiTextInput-label-text">Justify</span>
        <LuiButtonGroup>
          <LuiButton
            onClick={() => {
              setJustify(1);
              setPanelValuesToUpdate({ ...panelValuesToUpdate, justify: "textLeft" });
            }}
            className={clsx(`lui-button lui-button-secondary`, justify === 1 ? `lui-button-active` : "")}
            disabled={!areAllPageLabels(selectedLabels)}
          >
            Left
          </LuiButton>
          <LuiButton
            onClick={() => {
              setJustify(2);
              setPanelValuesToUpdate({ ...panelValuesToUpdate, justify: "textCenter" });
            }}
            className={clsx(`lui-button lui-button-secondary`, justify === 2 ? `lui-button-active` : "")}
            disabled={!areAllPageLabels(selectedLabels)}
          >
            Center
          </LuiButton>
          <LuiButton
            onClick={() => {
              setJustify(3);
              setPanelValuesToUpdate({ ...panelValuesToUpdate, justify: "textRight" });
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
