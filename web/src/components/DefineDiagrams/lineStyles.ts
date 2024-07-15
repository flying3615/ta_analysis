import { LinesResponseDTOLinesInnerSymbolTypeEnum as LinesSymbolType } from "@linz/survey-plan-generation-api-client";
import FeatureLike from "ol/Feature";
import { Style } from "ol/style";
import Stroke from "ol/style/Stroke";

export const lineStyles = (feature: FeatureLike): Style => {
  const symbolType = feature.get("symbolType");
  const color = symbolType === LinesSymbolType.CT ? "#000000" : "#878787";
  //line dash array goes [dash, gap, dash, gap]
  const lineDash = symbolType === LinesSymbolType.CT ? [8, 6, 2, 6] : [2, 7];

  return new Style({
    stroke: new Stroke({ width: 1.5, lineDash, color }),
  });
};
