import { CpgDiagramType } from "@linz/luck-syscodes/build/js/CpgDiagramType";
import FeatureLike from "ol/Feature";
import { Style } from "ol/style";
import Stroke from "ol/style/Stroke";

const systemGeneratedLineTypes = [CpgDiagramType.SYSN, CpgDiagramType.SYSP, CpgDiagramType.SYST];
const lineColourMap = {
  [CpgDiagramType.SYSN]: "#FF8000",
  [CpgDiagramType.SYSP]: "#009F00",
  [CpgDiagramType.SYST]: "#3F3FAA",
  [CpgDiagramType.UDFN]: "#FF8000",
  [CpgDiagramType.UDFP]: "#009F00",
  [CpgDiagramType.UDFT]: "#3F3FAA",
};

export const diagramStyles = (feature: FeatureLike): Style => {
  const diagramType = feature.get("diagramType") as CpgDiagramType;

  const lineDash = systemGeneratedLineTypes.includes(diagramType) ? [7, 10] : undefined;
  const color = lineColourMap[diagramType];

  return new Style({
    stroke: new Stroke({ width: 2, lineDash, color }),
  });
};
