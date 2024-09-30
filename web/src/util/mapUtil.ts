import { CartesianCoordsDTO } from "@linz/survey-plan-generation-api-client";
import { ClickedFeature } from "@linzjs/landonline-openlayers-map";
import { castArray } from "lodash-es";
import { Coordinate } from "ol/coordinate";
import { FeatureLike } from "ol/Feature";
import SimpleGeometry from "ol/geom/SimpleGeometry";
import OlMap from "ol/Map";
import { register } from "ol/proj/proj4";
import RenderFeature from "ol/render/Feature";
import proj4 from "proj4";

import { INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";

// adding projection definitions to allow conversions between them
// EPSG:1 is what the data from the DB comes in as
// EPSG:3857 is used as the openlayers map projection
proj4.defs("EPSG:1", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs +pm=160");
register(proj4);

export const cartesianToNumeric = (cartesian: CartesianCoordsDTO): number[] => [cartesian.x, cartesian.y];
export const numericToCartesian = (num: number[]): CartesianCoordsDTO => ({ x: num[0]!, y: num[1]! });

export const mapPointToLatLonShifted = (point: number[]): number[] => {
  return proj4("EPSG:3857", "EPSG:1", point);
};

/**
 * Normalizes the longitude between -180 to 180
 * Landonline DB does not store real coordinate so need to apply 160 longitude shift.
 * For outer island's data, when we apply 160 longitude shift the resulting longitude is -336 which is not ideal
 * This utility is used to calculate the longitude to be in the range of -180 and +180
 */
export const normalizeLongitude = (longitude: number): number =>
  longitude < -180 ? longitude + 360 : longitude > 180 ? longitude - 360 : longitude;

export const metersToLatLongCoordinate = (v: number[]): number[] => {
  const m = mapPointToLatLonShifted(v);
  return [normalizeLongitude(m[0]!), m[1]!];
};

export const metersToLatLongCartesian = (v: number[]) => numericToCartesian(metersToLatLongCoordinate(v));

const mapCoordinatesFromGeometry = (geometry: SimpleGeometry): Coordinate[] => {
  if (geometry.getType() === "Polygon") {
    return geometry.getCoordinates()?.[0] ?? [];
  } else {
    return geometry.getCoordinates() ?? [];
  }
};

export const geometryToLatLongCoordinates = (geometry: SimpleGeometry): Coordinate[] =>
  mapCoordinatesFromGeometry(geometry).map(metersToLatLongCoordinate);

export const geometryToLatLongCartesian = (geometry: SimpleGeometry): CartesianCoordsDTO[] =>
  mapCoordinatesFromGeometry(geometry).map(metersToLatLongCartesian);

/** =========================================================== */

export const getFeatureId = (f: number | FeatureLike | RenderFeature): number =>
  typeof f === "number" ? f : (f.get("id") as number);

export const getClickedFeatureId = (cf: ClickedFeature): number => getFeatureId(cf.feature);

export const clickedFeatureFilter = (field: string, values: unknown | unknown[]) => (clicked: ClickedFeature) =>
  castArray(values).includes(clicked.feature.get(field));

export const createNewNode = (
  datumNode: INodeData,
  id: string,
  xOffset: number,
  yOffset: number,
  label = "",
  customProperties?: Record<string, string | number | boolean | undefined>,
): INodeData => ({
  id,
  position: {
    x: datumNode.position.x + xOffset,
    y: datumNode.position.y + yOffset,
  },
  label,
  properties: { ...datumNode.properties, ...customProperties },
});

export const pixelsToMeters = (pixels: number): number => {
  // Assuming 96 DPI as a base.  There is no way of getting exact DPI in browser.
  // On my screen this calculation is off by 15%; inaccuracy is expected.
  const dpi = window.devicePixelRatio * 96;
  // Convert pixels to meters
  return ((pixels / dpi) * 2.54) / 100;
};

export const mapViewWidthMeters = (map: OlMap) => {
  const viewExtent = map.getView().calculateExtent();
  // @ts-expect-error object possible undefined
  return viewExtent[2] - viewExtent[0];
};

export const mapViewportWidthMeters = (map: OlMap) => {
  return pixelsToMeters(map.getViewport().getBoundingClientRect().width);
};

/**
 * This is based on legacy calculation from function of_sc_mapscale:
 * ll_scale = LONG(ld_mapWidth / ldc_screenMeters)
 */
export const mapZoomScale = (map: OlMap) => {
  return Math.floor(mapViewWidthMeters(map) / mapViewportWidthMeters(map)) || 1;
};
