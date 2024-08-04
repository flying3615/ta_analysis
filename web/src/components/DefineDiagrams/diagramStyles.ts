import { CpgDiagramType } from "@linz/luck-syscodes/build/js/CpgDiagramType";
import FeatureLike from "ol/Feature";
import RenderFeature from "ol/render/Feature";
import { Fill, Style } from "ol/style";
import Stroke from "ol/style/Stroke";

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

export const drawInteractionBoundaryBorder = new Style({
  stroke: new Stroke({
    color: "rgba(0, 153, 255, 1)",
    width: 3,
  }),
});

export const drawInteractionBoundaryBorderError = new Style({
  stroke: new Stroke({
    color: "rgba(255, 0, 0, 1)",
    width: 3,
  }),
});

export const drawInteractionBoundaryFill = new Style({
  stroke: new Stroke({
    color: "rgba(0, 0, 0, 0)",
    width: 3,
  }),
  fill: new Fill({
    color: "rgba(0, 153, 255, 0.1)",
  }),
});

export const drawInteractionBoundaryFillError = new Style({
  stroke: new Stroke({
    color: "rgba(204, 102, 0, 0)",
    width: 3,
  }),
  fill: new Fill({
    color: "rgba(255, 0, 0, 0.1)",
  }),
});
