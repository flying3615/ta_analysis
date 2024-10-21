import { ClickedFeature, LolOpenLayersMapContext } from "@linzjs/landonline-openlayers-map";
import { ILayerStatus } from "@linzjs/landonline-openlayers-map/dist/src/model/layerstatus";
import area from "@turf/area";
import { geometry } from "@turf/helpers";
import { compact, flatten, isEmpty, isEqual, minBy, pick, sortBy, uniq, xor } from "lodash-es";
import SimpleGeometry from "ol/geom/SimpleGeometry";
import MapBrowserEvent from "ol/MapBrowserEvent";
import { useContext, useEffect, useMemo, useRef } from "react";

import { useConstFunction } from "@/hooks/useConstFunction";
import { useHasChanged } from "@/hooks/useHasChanged";
import { geometryToLatLongCoordinates, getClickedFeatureId, getFeatureId } from "@/util/mapUtil";

export interface useSelectFeaturesProps {
  enabled: boolean;
  locked?: boolean;
  layer: string | string[];
  filterSelect?: (feature: ClickedFeature) => boolean;
}

export interface useSelectExtinguishedResult {
  selectedFeatureIds: number[];
}

export const useSelectFeatures = ({
  enabled,
  locked,
  layer: _layer,
  filterSelect,
}: useSelectFeaturesProps): useSelectExtinguishedResult => {
  const layer = useMemo(() => (Array.isArray(_layer) ? _layer : [_layer]), [_layer]);
  const { map, getFeaturesAtPixel } = useContext(LolOpenLayersMapContext);
  const { featureSelect, setFeatureSelect, setLayerStatus, layerStatus } = useContext(LolOpenLayersMapContext);

  const initialLayerState = useRef({} as Record<string, Partial<ILayerStatus>>);

  const selectedFeatures = flatten(layer.map((l) => featureSelect(l).map(getFeatureId)));
  const selectedFeatureIds = uniq(selectedFeatures.map(getFeatureId));

  const mapClickHandler = useConstFunction((ev: MapBrowserEvent<MouseEvent>): void => {
    if (!getFeaturesAtPixel || !enabled || locked) return;

    const layerClickedFeatures = sortBy(
      getFeaturesAtPixel(ev.pixel, 32).filter((f) => layer.includes(f.layer.getClassName())),
      (cf) => cf.distance,
    );

    // The min distance for polygons that have been clicked directly on will be 0
    const minDistance = minBy(layerClickedFeatures, (cf) => cf.distance)?.distance ?? 0;
    const layerClickedFeaturesNearest = layerClickedFeatures.filter((cf) => cf.distance <= minDistance + 1);
    const polygonTypeFeatureAreas = compact(
      layerClickedFeaturesNearest.map((cf) => {
        const geom = cf.feature.getGeometry() as SimpleGeometry;
        if (!geom || geom.getType() !== "Polygon") return null;
        const resizePolygon = geometry("Polygon", [geometryToLatLongCoordinates(geom)]);
        return { ...cf, area: area(resizePolygon) };
      }),
    );

    // Find polygon with the smallest area
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
    const currentFeatureIds = flatten(layer.map((l) => featureSelect(l).map(getFeatureId)));

    const select =
      ev.originalEvent.ctrlKey || ev.originalEvent.shiftKey
        ? xor(currentFeatureIds, clickedFeatureIds)
        : isEqual(clickedFeatureIds, currentFeatureIds)
          ? []
          : currentFeatureIds.some((id) => clickedFeatureIds.includes(id))
            ? xor(clickedFeatureIds, currentFeatureIds)
            : clickedFeatureIds;

    layer.forEach((l) => setFeatureSelect(l, select));
  });

  const enabledChanged = useHasChanged(enabled);
  useEffect(() => {
    if (!enabledChanged) return;
    layer.forEach((l, i) => {
      setFeatureSelect(l, []);
      const ls = layerStatus(l);

      if (enabled) {
        initialLayerState.current[l] = pick(ls, ["layerVisibility", "layerZIndex"]);
        setLayerStatus(l, { ...ls, layerVisibility: enabled, layerZIndex: 150 + i });
      } else {
        const preSelectLayerState = initialLayerState.current[l];
        delete initialLayerState.current[l];
        setLayerStatus(l, { ...ls, ...preSelectLayerState });
      }
    });
  }, [enabled, layer, layerStatus, enabledChanged, setFeatureSelect, setLayerStatus, initialLayerState]);

  useEffect(() => {
    map?.on("click", mapClickHandler);
    return () => {
      map?.un("click", mapClickHandler);
    };
  }, [mapClickHandler, map]);

  return {
    selectedFeatureIds,
  };
};
