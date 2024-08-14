import { ClickedFeature, LolOpenLayersMapContext } from "@linzjs/landonline-openlayers-map";
import { isEmpty, isEqual, minBy, sortBy, uniq, xor } from "lodash-es";
import MapBrowserEvent from "ol/MapBrowserEvent";
import { useContext, useEffect } from "react";

import { useConstFunction } from "@/hooks/useConstFunction.ts";
import { useHasChanged } from "@/hooks/useHasChanged.ts";
import { getClickedFeatureId, getFeatureId } from "@/util/mapUtil.ts";

export interface useSelectFeaturesProps {
  enabled: boolean;
  locked?: boolean;
  layer: string;
  filterSelect?: (feature: ClickedFeature) => boolean;
}

export interface useSelectExtinguishedResult {
  selectedFeatureIds: number[] | null;
}

export const useSelectFeatures = ({
  enabled,
  locked,
  layer,
  filterSelect,
}: useSelectFeaturesProps): useSelectExtinguishedResult => {
  const { map, getFeaturesAtPixel } = useContext(LolOpenLayersMapContext);
  const { featureSelect, setFeatureSelect, setLayerStatus, layerStatus } = useContext(LolOpenLayersMapContext);
  const funcRef = useConstFunction((ev: MapBrowserEvent<MouseEvent>): void => {
    if (!getFeaturesAtPixel || !enabled || locked) return;

    const layerClickedFeatures = sortBy(
      getFeaturesAtPixel(ev.pixel, 32).filter((f) => f.layer.getClassName() === layer),
      (cf) => cf.distance,
    );
    const minDistance = (minBy(layerClickedFeatures, (cf) => cf.distance)?.distance ?? 0) + 1;
    const layerClickedFeaturesNearest = layerClickedFeatures.filter((cf) => cf.distance <= minDistance);
    const clickedFeatureIds = uniq(
      (filterSelect ? layerClickedFeaturesNearest.filter(filterSelect) : layerClickedFeaturesNearest).map(
        getClickedFeatureId,
      ),
    );
    const currentFeatureIds = featureSelect(layer).map(getFeatureId);

    setFeatureSelect(
      layer,
      ev.originalEvent.ctrlKey
        ? xor(currentFeatureIds, clickedFeatureIds)
        : isEqual(clickedFeatureIds, currentFeatureIds)
          ? []
          : //
            currentFeatureIds.some((id) => clickedFeatureIds.includes(id))
            ? xor(clickedFeatureIds, currentFeatureIds)
            : clickedFeatureIds,
    );
  });

  const enabledChanged = useHasChanged(enabled);
  useEffect(() => {
    if (!enabledChanged) return;
    setFeatureSelect(layer, []);
    setLayerStatus(layer, { ...layerStatus(layer), layerVisibility: enabled });
  }, [enabled, layer, layerStatus, enabledChanged, setFeatureSelect, setLayerStatus]);

  useEffect(() => {
    if (!map) return;

    map.on("click", funcRef);
    return () => {
      map.un("click", funcRef);
    };
  }, [funcRef, map]);

  const selectedFeatures = featureSelect(layer);
  const selectedFeatureIds = isEmpty(selectedFeatures) ? null : selectedFeatures.map(getFeatureId);

  return {
    selectedFeatureIds,
  };
};
