import { CpgDiagramType } from "@linz/luck-syscodes/build/js/CpgDiagramType";
import { Feature } from "ol";
import FeatureLike from "ol/Feature";
import { Geometry } from "ol/geom";
import { Fill, Stroke, Style } from "ol/style";
import Text from "ol/style/Text";

import { MapColors } from "@/components/DefineDiagrams/mapColors";
/* Note: only the user defined diagrams (UD**) will have a label
         but there are a few old surveys in legacy with system gen diagrams that have labels
 */
const labelFillColorMap = {
  [CpgDiagramType.SYSN]: "#FFFFFF",
  [CpgDiagramType.SYSP]: "#FFFFFF",
  [CpgDiagramType.SYST]: "#FFFFFF",
  [CpgDiagramType.UDFN]: "#FF8000",
  [CpgDiagramType.UDFP]: "#009F00",
  [CpgDiagramType.UDFT]: "#3F3FAA",
};

const labelFontColorMap = {
  [CpgDiagramType.SYSN]: "#FF8000",
  [CpgDiagramType.SYSP]: "#009F00",
  [CpgDiagramType.SYST]: "#3F3FAA",
  [CpgDiagramType.UDFN]: "#FFFFFF",
  [CpgDiagramType.UDFP]: "#FFFFFF",
  [CpgDiagramType.UDFT]: "#FFFFFF",
};
const labelBorderWidthMap = {
  [CpgDiagramType.SYSN]: 1,
  [CpgDiagramType.SYSP]: 1,
  [CpgDiagramType.SYST]: 1,
  [CpgDiagramType.UDFN]: 0,
  [CpgDiagramType.UDFP]: 0,
  [CpgDiagramType.UDFT]: 0,
};

const labelBorderColorMap = {
  [CpgDiagramType.SYSN]: "#FF8000",
  [CpgDiagramType.SYSP]: "#009F00",
  [CpgDiagramType.SYST]: "#3F3FAA",
  [CpgDiagramType.UDFN]: "#FF8000",
  [CpgDiagramType.UDFP]: "#009F00",
  [CpgDiagramType.UDFT]: "#3F3FAA",
};

export const labelStyles = (feature: FeatureLike): Style => {
  const labelType = feature.get("type") as CpgDiagramType;
  const backgroundColor = labelFillColorMap[labelType];
  const labelFontColor = labelFontColorMap[labelType];
  const labelBorderWidth = labelBorderWidthMap[labelType];
  const labelBorderColor = labelBorderColorMap[labelType];
  return new Style({
    text: new Text({
      font: '11px "Open Sans",sans-serif',
      textBaseline: "top",
      textAlign: "center",
      offsetX: 0,
      offsetY: 0,
      text: feature.get("name") as string,
      fill: new Fill({ color: labelFontColor }),
      backgroundFill: new Fill({ color: backgroundColor }),
      padding: [0, 3, 0, 3],
      backgroundStroke: new Stroke({ color: labelBorderColor, width: labelBorderWidth }),
    }),
  });
};

export const labelStylesSelected = (_plainStyle: Style | Style[], feature: Feature<Geometry>): Style => {
  const labelType = feature.get("type") as CpgDiagramType;
  const labelBorderWidth = labelBorderWidthMap[labelType];
  return new Style({
    text: new Text({
      font: '11px "Open Sans",sans-serif',
      textBaseline: "top",
      textAlign: "center",
      offsetX: 0,
      offsetY: 0,
      text: feature.get("name") as string,
      fill: new Fill({ color: MapColors.white }),
      backgroundFill: new Fill({ color: MapColors.pink }),
      padding: [0, 3, 0, 3],
      backgroundStroke: new Stroke({ color: MapColors.pink, width: labelBorderWidth }),
    }),
  });
};
