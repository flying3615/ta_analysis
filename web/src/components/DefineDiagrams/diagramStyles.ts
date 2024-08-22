import { CpgDiagramType } from "@linz/luck-syscodes/build/js/CpgDiagramType";
import FeatureLike from "ol/Feature";
import RenderFeature from "ol/render/Feature";
import { Fill, Style } from "ol/style";
import Stroke from "ol/style/Stroke";

import { MapColors, MapFillColors } from "@/components/DefineDiagrams/mapColors.ts";
import { userDefinedDiagramTypes } from "@/queries/diagrams.ts";

const systemGeneratedLineTypes = [CpgDiagramType.SYSN, CpgDiagramType.SYSP, CpgDiagramType.SYST];
const lineColourMap = {
  [CpgDiagramType.SYSP]: "#009F00",
  [CpgDiagramType.SYSN]: "#FF8000",
  [CpgDiagramType.SYST]: "#3F3FAA",
  [CpgDiagramType.UDFP]: "#009F00",
  [CpgDiagramType.UDFN]: "#FF8000",
  [CpgDiagramType.UDFT]: "#3F3FAA",
};

export const diagramStyles = (feature: FeatureLike | RenderFeature): Style => {
  const diagramType = feature.get("diagramType") as CpgDiagramType;

  const lineDash = systemGeneratedLineTypes.includes(diagramType) ? [7, 10] : undefined;
  const color = lineColourMap[diagramType];

  return new Style({
    stroke: new Stroke({ width: 2, lineDash, color }),
  });
};

export const userDiagramStylesSelectable = (feature: FeatureLike | RenderFeature): Style => {
  const diagramType = feature.get("diagramType") as CpgDiagramType;

  return userDefinedDiagramTypes.includes(diagramType) ? diagramStyleSelectable : diagramStyles(feature);
};

export const diagramStylesSelected = new Style({
  stroke: new Stroke({ width: 2, color: MapColors.pink }),
  fill: new Fill({
    color: MapFillColors.pink,
  }),
});

const diagramStyleSelectable = new Style({
  stroke: new Stroke({ width: 2, color: MapColors.blue }),
  fill: new Fill({
    color: MapFillColors.blue,
  }),
});

export const drawInteractionBoundaryBorder = new Style({
  stroke: new Stroke({
    color: MapColors.blue,
    width: 3,
  }),
});

export const drawInteractionBoundaryBorderError = new Style({
  stroke: new Stroke({
    color: MapColors.red,
    width: 3,
  }),
});

export const drawInteractionBoundaryFill = new Style({
  stroke: new Stroke({
    color: MapColors.transparent,
    width: 3,
  }),
  fill: new Fill({
    color: MapFillColors.blue,
  }),
});

export const drawInteractionBoundaryFillError = new Style({
  stroke: new Stroke({
    color: MapColors.transparent,
  }),
  fill: new Fill({
    color: MapFillColors.red,
  }),
});
