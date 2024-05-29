import FeatureLike from "ol/Feature";
import { Style } from "ol/style";
import Stroke, { Options } from "ol/style/Stroke";
import { ObservationElementSurveyedClassCode } from "@linz/luck-syscodes/build/js/ObservationElementSurveyedClassCode";

export const VectorColors = {
  colorBlack: "rgb(0, 0, 0)",
  colorBlue: "rgb(0, 144, 255)",
  colorOrange: "rgb(235, 140, 52)",
  colorWhite: "rgb(255,255,255)",
};

export const VectorLineDashes = {
  [ObservationElementSurveyedClassCode.MEAS]: [5, 5],
  [ObservationElementSurveyedClassCode.PSED]: [8, 4],
};

const baseStroke: (width?: number, color?: string, lineDash?: number[]) => Options = (
  width = 1,
  color = VectorColors.colorBlack,
  lineDash = [],
) => ({
  color,
  lineDash,
  width,
});

export const measStyle = baseStroke(
  undefined,
  VectorColors.colorOrange,
  VectorLineDashes[ObservationElementSurveyedClassCode.MEAS],
);
export const calcStyle = baseStroke();
export const adptStyle = baseStroke();
export const reiStyle = baseStroke(3);
export const defaultStyle = baseStroke(
  undefined,
  VectorColors.colorBlue,
  VectorLineDashes[ObservationElementSurveyedClassCode.PSED],
);

export const vectorStyles = (feature: FeatureLike): Style => {
  // Parcel dimension vectors are white as per Legacy. Confirmed with Jeremy Gutsell and Phil Davison and they're both
  // unsure of why it is there, but to leave it as is.
  if (feature.get("isParcelDimensionVector")) {
    return new Style({
      stroke: new Stroke(baseStroke(1, VectorColors.colorWhite)),
    });
  }

  const surveyClass: ObservationElementSurveyedClassCode = feature.get("surveyClass");
  const lineType = observationStrokeOptionsMap[surveyClass];
  return new Style({
    stroke: new Stroke(lineType),
  });
};

export const observationStrokeOptionsMap: Record<ObservationElementSurveyedClassCode, Options> = {
  [ObservationElementSurveyedClassCode.MEAS]: measStyle,
  [ObservationElementSurveyedClassCode.CALC]: calcStyle,
  [ObservationElementSurveyedClassCode.ADPT]: adptStyle,
  [ObservationElementSurveyedClassCode.REIA]: reiStyle,
  [ObservationElementSurveyedClassCode.REIC]: reiStyle,
  [ObservationElementSurveyedClassCode.PSED]: defaultStyle,
};
