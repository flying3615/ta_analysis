import { ClickedFeature, LolOpenLayersMapContext } from "@linzjs/landonline-openlayers-map";
import area from "@turf/area";
import { compact, isEmpty, isEqual, minBy, sortBy, uniq, xor } from "lodash-es";
import MapBrowserEvent from "ol/MapBrowserEvent";
import { useContext, useEffect } from "react";

import { useConstFunction } from "@/hooks/useConstFunction.ts";
import { useHasChanged } from "@/hooks/useHasChanged.ts";
import { GeoJsonFromFeature, getClickedFeatureId, getFeatureId, isGeoJsonPolygonal } from "@/util/mapUtil.ts";

export interface useSelectFeaturesProps {
  enabled: boolean;
  locked?: boolean;
  layer: string;
  filterSelect?: (feature: ClickedFeature) => boolean;
}

export interface useSelectExtinguishedResult {
  selectedFeatureIds: number[];
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
    // Thin min distance for polygons that have been clicked directly on will be 0
    const minDistance = minBy(layerClickedFeatures, (cf) => cf.distance)?.distance ?? 0;
    const layerClickedFeaturesNearest = layerClickedFeatures.filter((cf) => cf.distance <= minDistance + 1);
    const polygonTypeFeatureAreas = compact(
      layerClickedFeaturesNearest.map((cf) => {
        const jsonFeature = GeoJsonFromFeature(cf.feature);
        if (!isGeoJsonPolygonal(jsonFeature)) return null;
        return { ...cf, area: area(jsonFeature) };
      }),
    );

    // Use non-polygonal smallest distance
    let layerClickedFeaturesToUse = layerClickedFeaturesNearest;
    if (!isEmpty(polygonTypeFeatureAreas)) {
      // Use polygon with the smallest area
      const minArea = minBy(polygonTypeFeatureAreas, (cf) => cf.area)?.area ?? 0;
      layerClickedFeaturesToUse = polygonTypeFeatureAreas.filter((cf) => cf.area <= minArea);
    }
    const clickedFeatureIds = uniq(
      (filterSelect ? layerClickedFeaturesToUse.filter(filterSelect) : layerClickedFeaturesToUse).map(
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
  const selectedFeatureIds = selectedFeatures.map(getFeatureId);

  return {
    selectedFeatureIds,
  };
};
