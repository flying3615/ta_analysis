import { LinesResponseDTOLinesInnerSymbolTypeEnum as LinesSymbolType } from "@linz/survey-plan-generation-api-client";
import FeatureLike from "ol/Feature";
import { Style } from "ol/style";
import Stroke from "ol/style/Stroke";

import { MapColors } from "@/components/DefineDiagrams/mapColors.ts";

export const lineStyles = (feature: FeatureLike): Style => {
  const symbolType = feature.get("symbolType");
  // line dash array pattern [dash, gap, dash, gap]
  const lineDash = symbolType === LinesSymbolType.CT ? [8, 6, 2, 6] : [2, 7];

  return new Style({
    stroke: new Stroke({ width: 3, lineDash, color: MapColors.black }),
  });
};

export const lineHighlightableStyles = (feature: FeatureLike): Style => {
  const symbolType = feature.get("symbolType");

  return symbolType === LinesSymbolType.CT
    ? new Style({
        stroke: new Stroke({ width: 4, color: MapColors.blue }),
      })
    : lineStyles(feature);
};

export const lineHighlightStyles = (): Style => {
  return new Style({
    stroke: new Stroke({ width: 4, color: MapColors.pink }),
  });
};

export const extinguishedLineStyles = (): Style => {
  return new Style({
    stroke: new Stroke({ width: 4, lineDash: [0], color: MapColors.blue }),
  });
};

export const extinguishedLineHighlightStyles = (): Style => {
  return new Style({
    stroke: new Stroke({ width: 4, color: MapColors.pink }),
  });
};
