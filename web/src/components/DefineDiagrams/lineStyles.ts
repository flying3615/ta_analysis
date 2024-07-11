import { LinesResponseDTOLinesInnerSymbolTypeEnum as LinesSymbolType } from "@linz/survey-plan-generation-api-client";
import FeatureLike from "ol/Feature";
import { Style } from "ol/style";
import Stroke from "ol/style/Stroke";

export const lineStyles = (feature: FeatureLike): Style => {
  const color = "#000000";
  //line dash array goes [dash, gap, dash, gap]
  const lineDash = feature.get("symbolType") === LinesSymbolType.CT ? [8, 4, 2, 4] : [5, 5];

  return new Style({
    stroke: new Stroke({ width: 1.5, lineDash, color }),
  });
};
