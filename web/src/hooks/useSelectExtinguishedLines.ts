import { LolOpenLayersMapContext } from "@linzjs/landonline-openlayers-map";
import { isEmpty } from "lodash-es";
import FeatureLike from "ol/Feature";
import { useContext, useEffect } from "react";

import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsType.ts";
import { usePrevious } from "@/hooks/usePrevious.ts";

export interface useConvertToRTLineProps {
  action: DefineDiagramsActionType;
}

export interface useSelectExtinguishedResult {
  selectedExtinguishedLineIds: number[] | null;
}

export const useSelectExtinguishedLines = ({ action }: useConvertToRTLineProps): useSelectExtinguishedResult => {
  const { featureSelect, setFeatureSelect, setLayerStatus, layerStatus } = useContext(LolOpenLayersMapContext);

  const enabled = action === "select_rt_line";
  const preEnabled = usePrevious(enabled);

  useEffect(() => {
    if (preEnabled === undefined || preEnabled === enabled) return;
    setFeatureSelect("extinguished-lines", []);
    setLayerStatus("extinguished-lines", { ...layerStatus("extinguished-lines"), layerVisibility: enabled });
  }, [enabled, layerStatus, preEnabled, setFeatureSelect, setLayerStatus]);

  const selectedFeatures = featureSelect("extinguished-lines");

  return {
    selectedExtinguishedLineIds: isEmpty(selectedFeatures)
      ? null
      : selectedFeatures.map((f) => (f as FeatureLike).get("id") as number),
  };
};
