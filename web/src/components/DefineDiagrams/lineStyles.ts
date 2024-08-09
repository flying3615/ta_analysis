import { LinesResponseDTOLinesInnerSymbolTypeEnum as LinesSymbolType } from "@linz/survey-plan-generation-api-client";
import FeatureLike from "ol/Feature";
import { Style } from "ol/style";
import Stroke from "ol/style/Stroke";

import { MapColors } from "@/components/DefineDiagrams/mapColors.ts";

// Constant styles

export const lineStyles_ct = new Style({
  stroke: new Stroke({ width: 3, lineDash: [8, 6, 2, 6], color: MapColors.black }),
});

export const lineStyle_selectable = new Style({
  stroke: new Stroke({ width: 4, color: MapColors.blue }),
});

export const lineStyles_abb = new Style({
  stroke: new Stroke({ width: 3, lineDash: [2, 7], color: MapColors.black }),
});

export const lineStyle_selected = new Style({
  stroke: new Stroke({ width: 4, color: MapColors.pink }),
});

// Functional styles

export const lineStyles = (feature: FeatureLike): Style =>
  feature.get("symbolType") === LinesSymbolType.CT ? lineStyles_ct : lineStyles_abb;

export const ctlineSelectableStyles = (feature: FeatureLike): Style =>
  feature.get("symbolType") === LinesSymbolType.CT ? lineStyle_selectable : lineStyles_abb;
