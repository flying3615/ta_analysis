import { LabelDTO, LabelDTOLabelTypeEnum } from "@linz/survey-plan-generation-api-client";

export const pageLabelWithLineBreak: LabelDTO = {
  id: 511,
  labelType: LabelDTOLabelTypeEnum.userAnnotation,
  displayText: "My page label\nwith a line break",
  font: "Times New Roman",
  fontSize: 16,
  fontStyle: "boldItalic",
  position: {
    x: 0.23,
    y: -0.18,
  },
  rotationAngle: 45,
  pointOffset: 0,
  anchorAngle: 0,
  textAlignment: "centerCenter, textRight",
  displayState: "display",
  effect: "none",
};

export const pageLabelAtEdge: LabelDTO = {
  id: 521,
  labelType: LabelDTOLabelTypeEnum.userAnnotation,
  displayText: "My page label at edge",
  font: "Times New Roman",
  fontSize: 16,
  fontStyle: "boldItalic",
  position: {
    x: 0.4,
    y: -0.1,
  },
  rotationAngle: 0,
  pointOffset: 0,
  anchorAngle: 0,
  textAlignment: "centerCenter, textRight",
  displayState: "display",
  effect: "none",
};

export const diagramLabelParcelAppellation: LabelDTO = {
  anchorAngle: 23,
  displayState: "hide",
  effect: "none",
  pointOffset: 14,
  rotationAngle: 0,
  textAlignment: "bottomCenter",
  id: 19,
  displayText: "Lot 123 Section 1",
  position: {
    x: 95,
    y: -75,
  },
  labelType: LabelDTOLabelTypeEnum.parcelAppellation,
  font: "Arial",
  fontSize: 16,
  fontStyle: "bold",
};

export const diagramObsBearingLabel: LabelDTO = {
  anchorAngle: 90,
  displayState: "display",
  effect: "none",
  pointOffset: 2,
  rotationAngle: 0,
  textAlignment: "bottomCenter",
  id: 20,
  featureId: 1002,
  displayText: "286°00'00\"",
  position: {
    x: 65,
    y: -10,
  },
  labelType: LabelDTOLabelTypeEnum.obsBearing,
  font: "Arial",
  fontSize: 16,
  fontStyle: "bold",
};

export const diagramObsDistLabel: LabelDTO = {
  anchorAngle: 270,
  displayState: "display",
  effect: "none",
  pointOffset: 2,
  rotationAngle: 0,
  textAlignment: "topCenter",
  id: 21,
  featureId: 1002,
  displayText: "43.5",
  position: {
    x: 65,
    y: -10,
  },
  labelType: LabelDTOLabelTypeEnum.obsDistance,
  font: "Arial",
  fontSize: 16,
  fontStyle: "bold",
};

export const diagramLabelObsBearingHide: LabelDTO = {
  id: 20,
  labelType: LabelDTOLabelTypeEnum.obsBearing,
  displayText: "1800°545'04\"",
  font: "Tahoma",
  fontSize: 14,
  fontStyle: "regular",
  position: {
    x: 95,
    y: -75,
  },
  rotationAngle: 90,
  pointOffset: 14,
  anchorAngle: 0,
  textAlignment: "bottomCenter",
  displayState: "display",
  featureId: 1006,
  featureType: "Line",
  effect: "none",
};

export const pageLabelWithBorderOutsideLayout: LabelDTO = {
  id: 519,
  labelType: LabelDTOLabelTypeEnum.userAnnotation,
  displayText: "Page label outside layout",
  font: "Tahoma",
  fontSize: 12,
  fontStyle: "italic",
  position: {
    x: 0.2,
    y: -0.3,
  },
  rotationAngle: 341.9,
  pointOffset: 18.5,
  anchorAngle: 95.4,
  textAlignment: "centerCenter",
  displayState: "hide",
  effect: "none",
  borderWidth: 1.4,
};
