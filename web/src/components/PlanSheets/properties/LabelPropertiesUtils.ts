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

const getCoordinatesOfLabelAlignments = (
  width: number,
  height: number,
  rotation: number,
  currentCenterX: number,
  currentCenterY: number,
) => {
  const halfTextDimWidth = width / 2;
  const halfTextDimHeight = height / 2;
  const labelCenter = { x: currentCenterX, y: currentCenterY };
  const tol = 3;
  // [top-left, top-center, top-right, center-left, center-center, center-right, bottom-left, bottom-center, bottom-right]
  const labelPolygonHoriz: cytoscape.Position[] = [
    { x: labelCenter.x - halfTextDimWidth - tol, y: labelCenter.y - halfTextDimHeight - tol },
    { x: labelCenter.x, y: labelCenter.y - halfTextDimHeight },
    { x: labelCenter.x + halfTextDimWidth + tol, y: labelCenter.y - halfTextDimHeight - tol },

    { x: labelCenter.x - halfTextDimWidth, y: labelCenter.y },
    { x: labelCenter.x, y: labelCenter.y },
    { x: labelCenter.x + halfTextDimWidth, y: labelCenter.y },

    { x: labelCenter.x - halfTextDimWidth - tol, y: labelCenter.y + halfTextDimHeight + tol },
    { x: labelCenter.x, y: labelCenter.y + halfTextDimHeight },
    { x: labelCenter.x + halfTextDimWidth + tol, y: labelCenter.y + halfTextDimHeight + tol },
  ];
  const labelTextRotation = rotation ? -rotation : 0; // negative because is counter clockwise
  // Rotate the label polygon
  const labelPolygonRotated = labelPolygonHoriz.map((point) => {
    const labelTextRotationRadians = degreesToRadians(labelTextRotation);
    return {
      x:
        labelCenter.x +
        (point.x - labelCenter.x) * Math.cos(labelTextRotationRadians) -
        (point.y - labelCenter.y) * Math.sin(labelTextRotationRadians),
      y:
        labelCenter.y +
        (point.x - labelCenter.x) * Math.sin(labelTextRotationRadians) +
        (point.y - labelCenter.y) * Math.cos(labelTextRotationRadians),
    };
  });

  return labelPolygonRotated;
};

const getCoordinatesOfLabelOrigin = (textAlignment: string, labelPolygonRotated: cytoscape.Position[]) => {
  let originX, originY;

  if (!textAlignment) {
    // centerCenter by default
    originX = labelPolygonRotated[4]?.x;
    originY = labelPolygonRotated[4]?.y;
  } else {
    if (textAlignment.includes("topLeft")) {
      originX = labelPolygonRotated[0]?.x;
      originY = labelPolygonRotated[0]?.y;
    } else if (textAlignment.includes("topCenter")) {
      originX = labelPolygonRotated[1]?.x;
      originY = labelPolygonRotated[1]?.y;
    } else if (textAlignment.includes("topRight")) {
      originX = labelPolygonRotated[2]?.x;
      originY = labelPolygonRotated[2]?.y;
    } else if (textAlignment.includes("centerLeft")) {
      originX = labelPolygonRotated[3]?.x;
      originY = labelPolygonRotated[3]?.y;
    } else if (textAlignment.includes("centerCenter")) {
      originX = labelPolygonRotated[4]?.x;
      originY = labelPolygonRotated[4]?.y;
    } else if (textAlignment.includes("centerRight")) {
      originX = labelPolygonRotated[5]?.x;
      originY = labelPolygonRotated[5]?.y;
    } else if (textAlignment.includes("bottomLeft")) {
      originX = labelPolygonRotated[6]?.x;
      originY = labelPolygonRotated[6]?.y;
    } else if (textAlignment.includes("bottomCenter")) {
      originX = labelPolygonRotated[7]?.x;
      originY = labelPolygonRotated[7]?.y;
    } else if (textAlignment.includes("bottomRight")) {
      originX = labelPolygonRotated[8]?.x;
      originY = labelPolygonRotated[8]?.y;
    } else {
      throw new Error("Invalid textAlignment");
    }
  }

  if (originX === undefined || originY === undefined) throw new Error("Invalid origin coordinates");

  return { x: originX, y: originY };
};

const rotateLabel = (
  width: number,
  height: number,
  currentRotation: number,
  newTextRotation: number,
  origin: string,
  currentCenterX: number,
  currentCenterY: number,
) => {
  const labelPolygonRotated = getCoordinatesOfLabelAlignments(
    width,
    height,
    currentRotation,
    currentCenterX,
    currentCenterY,
  );

  const { x: originX, y: originY } = getCoordinatesOfLabelOrigin(origin, labelPolygonRotated);

  if (originX === undefined || originY === undefined) throw new Error("Invalid origin coordinates");

  // Convert angle to radians
  const angle = currentRotation - (360 - newTextRotation);
  const radians = degreesToRadians(angle);

  // Calculate the new center position after rotation
  const newCenterX =
    originX + (currentCenterX - originX) * Math.cos(radians) - (currentCenterY - originY) * Math.sin(radians);
  const newCenterY =
    originY + (currentCenterX - originX) * Math.sin(radians) + (currentCenterY - originY) * Math.cos(radians);

  return { x: newCenterX, y: newCenterY };
};

/**
 * Add a temporary label to the cytoscape canvas so it can be used
 * to evaluate if it should be forced to fit within the page area
 */
const generateTempLabel = (
  cyto: cytoscape.Core | undefined,
  cytoCoordMapper: CytoscapeCoordinateMapper | null,
  labelId: string,
  labelPropsToUpdate: LabelPropsToUpdate | undefined,
  operation: LabelOperation,
) => {
  if (!cyto || !cytoCoordMapper) throw new Error("Cytoscape is not initialized");
  if (!labelPropsToUpdate) return;

  let initialLabelPosition = labelPropsToUpdate.position;
  const label = cyto?.$id(labelId); // the original label that is being edited
  if (label && label.length > 0 && initialLabelPosition === undefined) {
    initialLabelPosition = label.position();
  }
  if (!initialLabelPosition) return;

  const propRotationAngle = labelPropsToUpdate.rotationAngle;
  // if textRotation is being edited, need to make it anti-clockwise between 0-360
  const textRotation =
    propRotationAngle !== undefined ? (360 - propRotationAngle) % 360 : (label.data("textRotation") as number);

  const node = {
    group: "nodes" as ElementGroup,
    data: {
      ...(label.data() as INodeDataProperties),
      ...labelPropsToUpdate,
      id: `temp_${labelId}`,
      label: labelPropsToUpdate.displayText ?? labelPropsToUpdate.editedText ?? (label.data("label") as string),
      // for rotationSlide and alignToLine operations, the rotation is already applied directly to the label
      textRotation: ["rotationSlide", "alignToLine"].includes(operation)
        ? textRotation
        : (label.data("textRotation") as number),
      font: toDisplayFont(labelPropsToUpdate.font ?? (label?.data("font") as string) ?? "Tahoma"),
      fontSize: labelPropsToUpdate.fontSize ?? (label?.data("fontSize") as string) ?? 14,
    },
    position: initialLabelPosition,
  };

  cyto?.add(node);

  // if the operation is not rotationSlide or alignToLine, the rotation depends on the textAlignment of the label,
  // so the proper rotation is calculated and applied to the temp label
  if (propRotationAngle !== undefined && !["rotationSlide", "alignToLine"].includes(operation)) {
    const tempLabel = cyto?.$id(`temp_${labelId}`);
    const textDim = textDimensions(tempLabel, cytoCoordMapper);
    const textAlignment = tempLabel?.data("textAlignment") as string;
    const currentTextRotation = tempLabel?.data("textRotation") as number;

    const rotatedLabelPosition = rotateLabel(
      textDim.width,
      textDim.height,
      currentTextRotation,
      textRotation,
      textAlignment,
      tempLabel.position().x,
      tempLabel.position().y,
    );
    tempLabel?.data("textRotation", propRotationAngle).position(rotatedLabelPosition);
  }
};

export type LabelOperation = "textInput" | "propertiesEdit" | "rotationSlide" | "originalLocation" | "alignToLine";
/**
 * Get the corrected position for a created/edited label if it falls outside the page area
 * by adding a temporary label to the canvas with the edited values and evaluating its position
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
  generateTempLabel(cyto, cytoCoordMapper, labelId, labelPropsToUpdate, operation);
  // get temp label (with edited values) that will be used to evaluate the label dimensions and position within the page area
  const tempLabel = cyto?.$id(`temp_${labelId}`);

  const pageOuterLimits = cytoscapeUtils.getDiagramAreasLimits(cytoCoordMapper, cyto)?.diagramOuterLimitsPx;
  if (!pageOuterLimits) return;
  if (tempLabel.length === 0) throw new Error("tempLabel was not added to the canvas");

  // get the label dimensions and position
  const textDim = textDimensions(tempLabel, cytoCoordMapper);
  const labelCenter = tempLabel.position();

  const rotationAngle = tempLabel?.data("textRotation") as number;
  const textAlignment = tempLabel?.data("textAlignment") as string;
  const tempLabelPosition = JSON.parse(JSON.stringify(labelCenter)) as cytoscape.Position;
  const position = JSON.parse(JSON.stringify(labelCenter)) as cytoscape.Position;

  // if the temp label is outside the page area, move it back inside
  // (add a tolerance to the correction to prevent the label from being too close to the page edge)
  const tolerance = 7;

  const labelCoords = getCoordinatesOfLabelAlignments(
    textDim.width,
    textDim.height,
    rotationAngle,
    labelCenter.x,
    labelCenter.y,
  );
  const originCoords = getCoordinatesOfLabelOrigin(textAlignment, labelCoords);
  if (originCoords.x === undefined || originCoords.y === undefined) throw new Error("Invalid origin coordinates");

  const labelMinCoordY = Math.min(...labelCoords.map((coord) => coord.y));
  const labelMaxCoordY = Math.max(...labelCoords.map((coord) => coord.y));
  const labelMinCoordX = Math.min(...labelCoords.map((coord) => coord.x));
  const labelMaxCoordX = Math.max(...labelCoords.map((coord) => coord.x));

  let positionX;
  let positionY;
  let wasCorrected = false;
  if (labelMinCoordY < pageOuterLimits.y1) {
    // out of top bounds
    positionY = originCoords.y + (pageOuterLimits.y1 - labelMinCoordY) + tolerance;
    wasCorrected = true;
  }
  if (labelMaxCoordY > pageOuterLimits.y2) {
    // out of bottom bounds
    positionY = originCoords.y - (labelMaxCoordY - pageOuterLimits.y2) - tolerance;
    wasCorrected = true;
  }
  if (labelMinCoordX < pageOuterLimits.x1) {
    // out of left bounds
    positionX = originCoords.x + (pageOuterLimits.x1 - labelMinCoordX) + tolerance;
    wasCorrected = true;
  }
  if (labelMaxCoordX > pageOuterLimits.x2) {
    // out of right bounds
    positionX = originCoords.x - (labelMaxCoordX - pageOuterLimits.x2) - tolerance;
    wasCorrected = true;
  }

  if (wasCorrected) {
    position.x = positionX ?? originCoords.x;
    position.y = positionY ?? originCoords.y;
  }

  // remove the temporary label from the canvas
  cyto?.remove(tempLabel);

  // if the label position did not need correction to fit the page area, return undefined
  if (position.x === tempLabelPosition.x && position.y === tempLabelPosition.y) return;

  // if the operation is rotationSlide or alignToLine, the update is done directly on the canvas so,
  // no need to convert to ground coordinates or remove the pointOffset and anchorAngle effects,
  // return the cytoscape position as is to be applied to the canvas directly
  if (operation === "rotationSlide" || operation === "alignToLine") {
    return position;
  }

  // if the label has pointOffset/anchorAngle, remove it from the corrected position as
  // it will be applied on rendering the label in the canvas
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
