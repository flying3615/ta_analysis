import { ObservationElementSurveyedClassCode } from "@linz/luck-syscodes/build/js/ObservationElementSurveyedClassCode";
import { Feature } from "ol";
import { Geometry } from "ol/geom";

import {
  adptStyle,
  calcStyle,
  defaultStyle,
  measStyle,
  reiStyle,
  vectorStyles,
} from "@/components/DefineDiagrams/vectorStyles.ts";

import { MapColors } from "../mapColors";

const parcelDimensionVector = new Feature<Geometry>({ isParcelDimensionVector: true });
describe("vectorStyles", () => {
  it("styles parcelDimensionVector correctly", () => {
    const style = vectorStyles(parcelDimensionVector);
    const stroke = style.getStroke();
    expect(stroke.getColor()).toEqual(MapColors.white);
    expect(stroke.getWidth()).toBe(1);
  });

  test.each([
    [ObservationElementSurveyedClassCode.MEAS, measStyle],
    [ObservationElementSurveyedClassCode.CALC, calcStyle],
    [ObservationElementSurveyedClassCode.ADPT, adptStyle],
    [ObservationElementSurveyedClassCode.REIA, reiStyle],
    [ObservationElementSurveyedClassCode.REIC, reiStyle],
    [ObservationElementSurveyedClassCode.PSED, defaultStyle],
  ])("styles %p correctly", (surveyClass, expected) => {
    const nonBoundaryVector = new Feature<Geometry>({
      isParcelDimensionVector: false,
      isNonBoundaryVector: true,
      surveyClass,
    });
    const style = vectorStyles(nonBoundaryVector);
    const stroke = style.getStroke();
    expect(stroke.getColor()).toEqual(expected.color);
    expect(stroke.getWidth()).toBe(expected.width);
    expect(stroke.getLineDash()).toEqual(expected.lineDash);
  });
});
