import { CartesianCoordsDTO } from "@linz/survey-plan-generation-api-client";
import { ClickedFeature } from "@linzjs/landonline-openlayers-map";
import { castArray } from "lodash-es";
import { Coordinate } from "ol/coordinate";
import { FeatureLike } from "ol/Feature";
import SimpleGeometry from "ol/geom/SimpleGeometry";
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
