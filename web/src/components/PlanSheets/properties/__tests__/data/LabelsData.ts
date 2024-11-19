import { LabelDTO } from "@linz/survey-plan-generation-api-client";

export const pageLabelWithLineBreak: LabelDTO = {
  id: 511,
  labelType: "userAnnotation",
  displayText: "My page label\nwith a line break",
  font: "Times New Roman",
  fontSize: 16,
  fontStyle: "boldItalic",
  position: {
    x: 0.22,
    y: -0.18,
  },
  rotationAngle: 0,
  pointOffset: 0,
  anchorAngle: 0,
  textAlignment: "centerCenter, textRight",
  displayState: "display",
  effect: "none",
};

export const pageLabelWithBorder: LabelDTO = {
  id: 512,
  labelType: "userAnnotation",
  displayText: "Some other page label",
  font: "Tahoma",
  fontSize: 12,
  fontStyle: "italic",
  position: {
    x: 0.175908237748,
    y: -0.23382168926,
  },
  rotationAngle: 341.9,
  pointOffset: 18.5,
  anchorAngle: 95.4,
  textAlignment: "centerCenter",
  displayState: "hide",
  effect: "none",
  borderWidth: 1.4,
};

export const diagramLabelParcelAppellation: LabelDTO = {
  anchorAngle: 0,
  displayState: "hide",
  effect: "none",
  pointOffset: 14,
  rotationAngle: 0,
  textAlignment: "bottomCenter",
  id: 19,
  displayText: "Lot 123",
  position: {
    x: 30,
    y: -50,
  },
  labelType: "parcelAppellation",
  font: "Arial",
  fontSize: 16,
  fontStyle: "bold",
};

export const diagramLabelObsBearingHide: LabelDTO = {
  id: 20,
  labelType: "obsBearing",
  displayText: "18°54'04\"",
  font: "Tahoma",
  fontSize: 14,
  fontStyle: "regular",
  position: {
    x: 79,
    y: -60,
  },
  rotationAngle: 270,
  pointOffset: 14,
  anchorAngle: 0,
  textAlignment: "centerCenter",
  displayState: "hide",
  featureId: 1006,
  featureType: "Line",
  effect: "none",
};

export const diagramLabelObsBearingSuppressSeconds: LabelDTO = {
  id: 21,
  labelType: "obsBearing",
  displayText: "23°12'00\"",
  displayFormat: "suppressSeconds",
  font: "Tahoma",
  fontSize: 16,
  fontStyle: "bold",
  position: {
    x: 60,
    y: -9,
  },
  rotationAngle: 0,
  pointOffset: 14,
  anchorAngle: 0,
  textAlignment: "centerCenter",
  displayState: "display",
  featureId: 1006,
  featureType: "Line",
  effect: "none",
};

export const diagramLabelSystemDisplay: LabelDTO = {
  id: 313,
  displayText: "Diag. AB",
  font: "Tahoma",
  fontSize: 14,
  labelType: "diagram",
  fontStyle: "regular",
  rotationAngle: 0,
  anchorAngle: 11.2,
  pointOffset: 65.8,
  textAlignment: "bottomCenter",
  displayState: "systemDisplay",
  position: {
    x: 80,
    y: -5,
  },
  effect: "none",
};

export const diagramLabelSystemHide: LabelDTO = {
  id: 314,
  displayText: "System Hide Label",
  font: "Tahoma",
  fontSize: 14,
  labelType: "diagram",
  fontStyle: "regular",
  rotationAngle: 90,
  anchorAngle: 11.2,
  pointOffset: 65.8,
  textAlignment: "bottomCenter",
  displayState: "systemHide",
  position: {
    x: 90,
    y: -10,
  },
  effect: "none",
};
