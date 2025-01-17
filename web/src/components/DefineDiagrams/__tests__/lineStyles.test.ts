import { LinesResponseDTOLinesInnerSymbolTypeEnum as LinesSymbolType } from "@linz/survey-plan-generation-api-client";
import { Feature } from "ol";
import { Geometry } from "ol/geom";

import {
  ctlineSelectableStyles,
  lineStyle_selectable,
  lineStyles,
  lineStyles_abb,
  lineStyles_abb_selectable,
  lineStyles_ct,
} from "@/components/DefineDiagrams/lineStyles";

const ctLineFeature = new Feature<Geometry>({
  symbolType: LinesSymbolType.CT,
});

const abbLineFeature = new Feature<Geometry>({
  symbolType: LinesSymbolType.ABB,
});

describe("lineStyles", () => {
  test("default lineStyles", () => {
    expect(lineStyles(ctLineFeature)).toBe(lineStyles_ct);
    expect(lineStyles(abbLineFeature)).toBe(lineStyles_abb);
  });

  test("selectable lineStyles", () => {
    expect(ctlineSelectableStyles(ctLineFeature)).toBe(lineStyle_selectable);
    expect(ctlineSelectableStyles(abbLineFeature)).toBe(lineStyles_abb_selectable);
  });
});
