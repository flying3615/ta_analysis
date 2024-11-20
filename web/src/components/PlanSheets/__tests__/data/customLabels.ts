import { LabelDTO } from "@linz/survey-plan-generation-api-client";

export const pageLabelWithLineBreak: LabelDTO = {
  id: 511,
  labelType: "userAnnotation",
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
  labelType: "parcelAppellation",
  font: "Arial",
  fontSize: 16,
  fontStyle: "bold",
};

export const diagramLabelObsBearingHide: LabelDTO = {
  id: 20,
  labelType: "obsBearing",
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
  textAlignment: "centerCenter",
  displayState: "display",
  featureId: 1006,
  featureType: "Line",
  effect: "none",
};
