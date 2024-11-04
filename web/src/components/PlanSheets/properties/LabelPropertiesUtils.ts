import { DisplayStateEnum, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import { SelectOptions } from "@linzjs/lui/dist/components/LuiFormElements/LuiSelectInput/LuiSelectInput";
import { uniq } from "lodash-es";

import { LabelPropertiesData, LabelPropsToUpdate, PanelValuesToUpdate } from "./LabelProperties";

export const labelTypeOptions: SelectOptions[] = [
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

export const fontOptions: SelectOptions[] = [
  { value: "Tahoma", label: "Tahoma" },
  { value: "Arial", label: "Arial" },
  { value: "Times New Roman", label: "Times New Roman" },
];

export const fontSizeOptions: SelectOptions[] = [
  { value: "8", label: "8" },
  { value: "10", label: "10" },
  { value: "12", label: "12" },
  { value: "14", label: "14" },
  { value: "16", label: "16" },
];

export const borderWidthOptions: SelectOptions[] = [
  { value: "0.7", label: "0.7" },
  { value: "1.0", label: "1.0" },
  { value: "1.4", label: "1.4" },
  { value: "2.0", label: "2.0" },
];

export const textAlignmentEnum = {
  textLeft: 1,
  textCenter: 2,
  textRight: 3,
};

export const getCommonPropertyValue = <T extends keyof LabelPropertiesData>(
  arr: LabelPropertiesData[],
  property: T,
): string | undefined => {
  const values = arr.map((item) => item[property]);
  const uniqueValues = uniq(values);
  return uniqueValues.length === 1 ? uniqueValues[0] : undefined;
};

export const someButNotAllHavePropertyValue = <T extends keyof LabelPropertiesData>(
  arr: LabelPropertiesData[],
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

export const areAllPageLabels = (arr: LabelPropertiesData[]) => {
  return arr.every((item) => item.diagramId === undefined);
};

export const allHave00 = (arr: LabelPropertiesData[]) => {
  return arr.every((item) => item.label.includes('00"'));
};

export const anyHasDisplayState = (arr: LabelPropertiesData[], displayStates: string[]) => {
  return arr.some((item) => displayStates.includes(item.displayState));
};

export const getTextAlignmentValues = (arr: LabelPropertiesData[]) => {
  return ["textRight", "textCenter"].filter((value) => arr.some((item) => item.textAlignment.includes(value)));
};

export const cleanTextAlignment = (textAlignment: string) => {
  return textAlignment
    .replace(/textLeft|textCenter|textRight/g, "") // remove textLeft, textCenter, textRight
    .replace(/^,+|,+$/g, "") // trim commas from start and end
    .trim();
};

export const createLabelPropsToBeSaved = (
  panelValuesToUpdate: PanelValuesToUpdate,
  selectedLabel: LabelPropertiesData,
) => {
  const newObj: LabelPropsToUpdate = { id: cytoscapeLabelIdToPlanData(selectedLabel.id) };

  if ("labelText" in panelValuesToUpdate) {
    newObj.displayText = panelValuesToUpdate.labelText;
  }
  if ("displayState" in panelValuesToUpdate) {
    newObj.displayState = panelValuesToUpdate.displayState as DisplayStateEnum;
  }
  if ("hide00" in panelValuesToUpdate) {
    newObj.displayFormat = panelValuesToUpdate.hide00 ? "suppressSeconds" : undefined;
  }
  if ("isBold" in panelValuesToUpdate) {
    newObj.fontStyle = panelValuesToUpdate.isBold
      ? selectedLabel.fontStyle === "italic"
        ? "boldItalic"
        : "bold"
      : selectedLabel.fontStyle === "boldItalic"
        ? "italic"
        : "regular";
  }
  if ("font" in panelValuesToUpdate) {
    newObj.font = panelValuesToUpdate.font;
  }
  if ("fontSize" in panelValuesToUpdate) {
    newObj.fontSize = Number(panelValuesToUpdate.fontSize);
  }
  if ("textRotation" in panelValuesToUpdate) {
    const textRotation = Number(panelValuesToUpdate.textRotation);
    const rotationAngle = ((textRotation % 360) + 360) % 360; // normalize angle to a value between 0 and 360
    newObj.rotationAngle = parseFloat(rotationAngle.toFixed(4));
  }
  if ("justify" in panelValuesToUpdate) {
    if (panelValuesToUpdate.justify === "textLeft") {
      newObj.textAlignment = cleanTextAlignment(selectedLabel.textAlignment);
    }
    if (["textCenter", "textRight"].includes(panelValuesToUpdate.justify ?? "")) {
      newObj.textAlignment = `${cleanTextAlignment(selectedLabel.textAlignment)},${panelValuesToUpdate.justify}`;
    }
  }
  if ("borderWidth" in panelValuesToUpdate) {
    newObj.borderWidth = panelValuesToUpdate.borderWidth ? Number(panelValuesToUpdate.borderWidth) : undefined;
  }

  return newObj;
};

export const textLengthLimit = 2048;
export const specialCharsRegex = /[\u00B2\u00BA\u00B0]/; // ², º, °
export const invalidCharactersErrorMessage = "Invalid character(s) entered";
export const getTextLengthErrorMessage = (numberOverLimit: number) => `${numberOverLimit} characters over the limit`;

export const cytoscapeLabelIdToPlanData = (cytoscapeLabelId: string | undefined): number => {
  if (!cytoscapeLabelId) {
    throw new Error("id is undefined for a cytoscape label");
  }
  if (!cytoscapeLabelId.match(new RegExp("LAB_\\d+"))) {
    throw new Error(`labelCytoscapeIdToPlanData expects an id in the form LAB_NNN got ${cytoscapeLabelId}`);
  }
  return parseInt(cytoscapeLabelId.replace("LAB_", ""));
};

export const planDataLabelIdToCytoscape = (planDataLabelId: number) => `LAB_${planDataLabelId}`;
