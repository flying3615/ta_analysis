import { DisplayStateEnum, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";
import { SelectOptions } from "@linzjs/lui/dist/components/LuiFormElements/LuiSelectInput/LuiSelectInput";
import { degreesToRadians } from "@turf/helpers";
import { ElementGroup, NodeSingular } from "cytoscape";
import { isNil, uniq } from "lodash-es";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { GroundMetresPosition, INodeDataProperties } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData";
import { toDisplayFont } from "@/components/CytoscapeCanvas/fontDisplayFunctions";
import { textDimensions } from "@/components/CytoscapeCanvas/styleNodeMethods";
import { cytoscapeUtils } from "@/util/cytoscapeUtil";

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

export const viewLabelTypeOptions: SelectOptions[] = [
  { value: LabelDTOLabelTypeEnum.markDescription, label: "Mark descriptions" },
  { value: LabelDTOLabelTypeEnum.markName, label: "Mark names" },
  { value: `${LabelDTOLabelTypeEnum.nodeSymbol1},${LabelDTOLabelTypeEnum.nodeSymbol2}`, label: "Node symbols" },
  { value: LabelDTOLabelTypeEnum.arcRadius, label: "Observation arc radii" },
  { value: LabelDTOLabelTypeEnum.obsBearing, label: "Observation bearings" },
  { value: LabelDTOLabelTypeEnum.obsCode, label: "Observation codes" },
  { value: LabelDTOLabelTypeEnum.obsDistance, label: "Observation distances" },
  { value: LabelDTOLabelTypeEnum.parcelAppellation, label: "Parcel appellations" },
  { value: LabelDTOLabelTypeEnum.parcelArea, label: "Parcel areas" },
  {
    value: `${LabelDTOLabelTypeEnum.lineDescription},${LabelDTOLabelTypeEnum.lineLongDescription}`,
    label: "Water/irregular boundary",
  },
];

export const defaultOptionalVisibileLabelTypes = viewLabelTypeOptions
  .flatMap((o) => o.value.split(","))
  .filter((v) => v !== LabelDTOLabelTypeEnum.obsCode);

export const alwaysVisibleLabelTypes: string[] = [
  LabelDTOLabelTypeEnum.userAnnotation,
  LabelDTOLabelTypeEnum.childDiagram,
  LabelDTOLabelTypeEnum.childDiagramPage,
  LabelDTOLabelTypeEnum.diagram,
  LabelDTOLabelTypeEnum.diagramType,
];

export const editableLabelTextTypes: string[] = [
  LabelDTOLabelTypeEnum.userAnnotation,
  LabelDTOLabelTypeEnum.parcelAppellation,
  LabelDTOLabelTypeEnum.lineDescription,
  LabelDTOLabelTypeEnum.lineLongDescription,
  LabelDTOLabelTypeEnum.markDescription,
];

export const lineBreakRestrictedEditTypes: string[] = [
  LabelDTOLabelTypeEnum.parcelAppellation,
  LabelDTOLabelTypeEnum.lineDescription,
  LabelDTOLabelTypeEnum.lineLongDescription,
  LabelDTOLabelTypeEnum.markDescription,
];

// Create type using typeof and array index
type LineBreakRestrictedEditType = (typeof lineBreakRestrictedEditTypes)[number];

export const fontOptions: SelectOptions[] = [
  { value: "Arial", label: "Arimo (was Arial)" },
  { value: "Tahoma", label: "Roboto (was Tahoma)" },
  { value: "Times New Roman", label: "Tinos (was Times New Roman)" },
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

/**
 * This refers to label types whose Justify Property can be adjusted.
 * Legacy only allows Page or ParcelAppellations.
 * We can extend types (e.g. Line Description) once legacy is switched off.
 */
export const areAllPageOrParcelAppelationLabels = (arr: LabelPropertiesData[]) => {
  return arr.every(
    (item) => item.diagramId === undefined || item.labelType === LabelDTOLabelTypeEnum.parcelAppellation,
  );
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
    if (selectedLabel.labelType === LabelDTOLabelTypeEnum.userAnnotation) {
      newObj.displayText = panelValuesToUpdate.labelText;
    } else if (isLineBreakRestrictedEditType(selectedLabel.labelType) && selectedLabel.diagramId) {
      newObj.editedText = panelValuesToUpdate.labelText;
    }
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

export const ANGLE_REGEXP_DMS = "^([0-1]?[0-9]{1,2}\\.([0-5]?[0-9])([0-5]?[0-9]))$";
export const ANGLE_REGEXP_DMS_PATTERN = new RegExp(ANGLE_REGEXP_DMS);
export const angleExceedErrorMessage = "Must be between 0 and 180 degrees";
export const angleFormatErrorMessage = "Must be a number in D.MMSS format";

export const getTextLengthErrorMessage = (numberOverLimit: number) => `${numberOverLimit} characters over the limit`;
export const parcelAppellationInfoMessage = "Appellations cannot be altered";
export const lineDescriptionInfoMessage = "Line Descriptions cannot be altered";
export const markDescriptionInfoMessage = "Mark Descriptions cannot be altered";

export const lineBreakRestrictedInfoMessages: Record<LineBreakRestrictedEditType, string> = {
  [LabelDTOLabelTypeEnum.parcelAppellation]: parcelAppellationInfoMessage,
  [LabelDTOLabelTypeEnum.lineDescription]: lineDescriptionInfoMessage,
  [LabelDTOLabelTypeEnum.lineLongDescription]: lineDescriptionInfoMessage,
  [LabelDTOLabelTypeEnum.markDescription]: markDescriptionInfoMessage,
};

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

export const restoreZIndex = (elem: NodeSingular) => {
  [DisplayStateEnum.hide.valueOf(), DisplayStateEnum.systemHide.valueOf()].includes(elem.data("displayState") as string)
    ? elem.style("zIndex", "100")
    : elem.style("zIndex", "200");
};

export const increaseZIndex = (elem: NodeSingular) => {
  elem.style("zIndex", 300);
};

export const createLineBreakRestrictedEditRegex = (labelText?: string): string => {
  if (!labelText) return "";

  const parts = labelText.split(/[\r\n ]/).map(escapeRegexReservedCharacters);
  return `^${parts.join("([\\r\\n ]*)")}$`;
};

/**
 * Add a temporary label to the cytoscape canvas so it can be used
 * to evaluate if it should be forced to fit within the page area
 */
const generateTempLabel = (
  cyto: cytoscape.Core | undefined,
  labelId: string,
  labelPropsToUpdate: LabelPropsToUpdate | undefined,
) => {
  if (!cyto) throw new Error("Cytoscape is not initialized");
  if (!labelPropsToUpdate) return;

  let initialLabelPosition = labelPropsToUpdate.position;
  const label = cyto?.$id(labelId); // the original label that is being edited
  if (label && label.length > 0 && initialLabelPosition === undefined) {
    initialLabelPosition = label.position();
  }
  if (!initialLabelPosition) return;

  const node = {
    group: "nodes" as ElementGroup,
    data: {
      ...(label.data() as INodeDataProperties),
      ...labelPropsToUpdate,
      id: `temp_${labelId}`,
      label: labelPropsToUpdate.displayText ?? labelPropsToUpdate.editedText ?? (label.data("label") as string),
      // if textRotation is being edited, need to make it anti-clockwise between 0-360
      textRotation:
        labelPropsToUpdate.rotationAngle !== undefined
          ? (360 - labelPropsToUpdate.rotationAngle) % 360
          : (label.data("textRotation") as string),
      font: toDisplayFont(labelPropsToUpdate.font ?? (label?.data("font") as string) ?? "Tahoma"),
      fontSize: labelPropsToUpdate.fontSize ?? (label?.data("fontSize") as string) ?? 14,
    },
    position: initialLabelPosition,
  };
  cyto?.add(node);
};

export type LabelOperation = "textInput" | "propertiesEdit" | "rotationSlide" | "originalLocation" | "alignToLine";
/**
 * Get the corrected position for a created/edited label if it falls outside the page area
 */
export const getCorrectedLabelPosition = (
  cyto: cytoscape.Core | undefined,
  cytoCoordMapper: CytoscapeCoordinateMapper | null,
  labelId: string,
  operation: LabelOperation,
  labelPropsToUpdate: LabelPropsToUpdate | undefined,
): GroundMetresPosition | cytoscape.Position | undefined => {
  if (!cyto || !cytoCoordMapper) throw new Error("Cytoscape or CytoscapeCoordinateMapper is not initialized");

  // if the label is being edited, there will be an original label in cytoscape canvas
  const label = cyto?.$id(labelId);

  // if the operation is originalLocation, the label position in labelPropsToUpdate is in ground coordinates
  // and needs to be converted to cytoscape position
  if (operation === "originalLocation" && labelPropsToUpdate) {
    if (isNil(labelPropsToUpdate.position)) {
      labelPropsToUpdate.position = {
        x: label?.position().x - (label?.data("offsetX") ?? 0),
        y: label?.position().y - (label?.data("offsetY") ?? 0),
      };
    } else {
      // convert the position in labelPropsToUpdate from ground coordinates to cytoscape position
      if (label) {
        // if there is a label in the cytoscape canvas, it is an existing label which is being edited
        const diagramId = label.data("diagramId") as number;
        labelPropsToUpdate.position = diagramId
          ? cytoCoordMapper.groundCoordToCytoscape(labelPropsToUpdate.position, diagramId)
          : cytoCoordMapper.pageLabelCoordToCytoscape(labelPropsToUpdate.position);
      } else {
        // if there is no original label in the cytoscape canvas, it is a new user-added label
        labelPropsToUpdate.position = cytoCoordMapper.pageLabelCytoscapeToCoord(labelPropsToUpdate.position);
      }
    }
  }

  // add a temporary label (based on the created/edited label) to the canvas
  generateTempLabel(cyto, labelId, labelPropsToUpdate);
  // get temp label (with edited values) that will be used to evaluate the label dimensions and position within the page area
  const tempLabel = cyto?.$id(`temp_${labelId}`);

  const pageOuterLimits = cytoscapeUtils.getDiagramAreasLimits(cytoCoordMapper, cyto)?.diagramOuterLimitsPx;
  if (!pageOuterLimits) return;
  if (tempLabel.length === 0) throw new Error("tempLabel was not added to the canvas");

  // get the label dimensions and position
  const textDim = textDimensions(tempLabel, cytoCoordMapper);
  const halfTextDimWidth = textDim.width / 2;
  const halfTextDimHeight = textDim.height / 2;
  const labelCenter = tempLabel.position();
  let labelStartCoord = labelCenter.x - halfTextDimWidth;
  let labelEndCoord = labelCenter.x + halfTextDimWidth;
  let labelTopCoord = labelCenter.y - halfTextDimHeight;
  let labelBottomCoord = labelCenter.y + halfTextDimHeight;

  // if the label has a rotation angle, apply the label rotation to the label dimensions
  const rotationAngle = tempLabel?.data("textRotation") as number;
  if (!isNil(rotationAngle)) {
    const angle = degreesToRadians(rotationAngle);
    const rotatedWidth = textDim.width * Math.abs(Math.cos(angle)) + textDim.height * Math.abs(Math.sin(angle));
    const rotatedHeight = textDim.width * Math.abs(Math.sin(angle)) + textDim.height * Math.abs(Math.cos(angle));
    const halfRotatedWidth = rotatedWidth / 2;
    const halfRotatedHeight = rotatedHeight / 2;
    labelStartCoord = labelCenter.x - halfRotatedWidth;
    labelEndCoord = labelCenter.x + halfRotatedWidth;
    labelTopCoord = labelCenter.y - halfRotatedHeight;
    labelBottomCoord = labelCenter.y + halfRotatedHeight;
  }

  const tempLabelPosition = tempLabel.position();
  const position = JSON.parse(JSON.stringify(tempLabelPosition)) as cytoscape.Position;

  // if the temp label is outside the page area, move it back inside
  const tolerance = 5;
  if (labelStartCoord < pageOuterLimits.x1) {
    position.x = labelCenter.x + (pageOuterLimits.x1 - labelStartCoord) + tolerance;
  }
  if (labelEndCoord > pageOuterLimits.x2) {
    position.x = labelCenter.x - (labelEndCoord - pageOuterLimits.x2) - tolerance;
  }
  if (labelTopCoord < pageOuterLimits.y1) {
    position.y = labelCenter.y + (pageOuterLimits.y1 - labelTopCoord) + tolerance;
  }
  if (labelBottomCoord > pageOuterLimits.y2) {
    position.y = labelCenter.y - (labelBottomCoord - pageOuterLimits.y2) - tolerance;
  }
  cyto?.remove(tempLabel);

  // if the label position did not need correction to fit the page area, return undefined
  if (position.x === tempLabelPosition.x && position.y === tempLabelPosition.y) return;

  // if the operation is rotationSlide or alignToLine, the update is done directly on the canvas so,
  // no need to convert to ground coordinates or remove the pointOffset and anchorAngle effects,
  // return the cytoscape position as is to be applied to the canvas directly
  if (operation === "rotationSlide" || operation === "alignToLine") {
    return position;
  }

  // if the label has pointOffset, remove it from the corrected position since it will be applied on canvas render
  const pointOffset = tempLabel?.data("pointOffset") as number;
  const anchorAngle = tempLabel?.data("anchorAngle") as number;
  if (pointOffset && !isNil(anchorAngle)) {
    const { x, y } = position;
    const angle = degreesToRadians(anchorAngle);
    const xOffset = pointOffset * Math.cos(angle);
    const yOffset = pointOffset * Math.sin(angle);
    position.x = x - xOffset;
    position.y = y + yOffset;
  }

  // convert the corrected position from cytoscape position to ground coordinates
  let positionCoord: cytoscape.Position | GroundMetresPosition = position;
  if (label) {
    // if there is a label in the cytoscape canvas, it is an existing label which is being edited
    const diagramId = label.data("diagramId") as number;
    positionCoord = diagramId
      ? cytoCoordMapper.cytoscapeToGroundCoord(position, diagramId)
      : cytoCoordMapper.pageLabelCytoscapeToCoord(position);
  } else {
    // if there is no original label in the cytoscape canvas, it is a new user-added label
    positionCoord = cytoCoordMapper.pageLabelCytoscapeToCoord(position);
  }
  return positionCoord;
};

export const isEditableLabelTextType = (labelType?: string) => {
  return !!labelType && editableLabelTextTypes.includes(labelType);
};

export const isLineBreakRestrictedEditType = (labelType?: string) => {
  return !!labelType && lineBreakRestrictedEditTypes.includes(labelType);
};

export const escapeRegexReservedCharacters = (part: string): string => part.replace(/[-[\]{}()*+?.,\\^$|]/g, "\\$&");
