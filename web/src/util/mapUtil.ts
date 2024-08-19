import { ICartesianCoords } from "@linz/survey-plan-generation-api-client";
import { ClickedFeature } from "@linzjs/landonline-openlayers-map";
import { Feature, LineString, Polygon, Position } from "geojson";
import { castArray, chunk } from "lodash-es";
import { Feature as olFeature } from "ol";
import { Coordinate } from "ol/coordinate";
import { FeatureLike } from "ol/Feature";
import { GeoJSON } from "ol/format";
import { GeoJSONFeature } from "ol/format/GeoJSON";
import { Geometry as olGeometry } from "ol/geom";
import SimpleGeometry from "ol/geom/SimpleGeometry";
import { register } from "ol/proj/proj4";
import RenderFeature from "ol/render/Feature";
import proj4 from "proj4";

// adding projection definitions to allow conversions between them
// EPSG:1 is what the data from the DB comes in as
// EPSG:3857 is used as the openlayers map projection
proj4.defs("EPSG:1", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs +pm=160");
register(proj4);

export const cartesianToNumeric = (cartesian: ICartesianCoords): number[] => [cartesian.x, cartesian.y];
export const numericToCartesian = (num: number[]): ICartesianCoords => ({ x: num[0]!, y: num[1]! });

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

export const mapPointToCoordinate = (v: number[]): number[] => {
  const m = mapPointToLatLonShifted(v);
  return [normalizeLongitude(m[0]!), m[1]!];
};

export const mapPointToCartesian = (v: number[]) => numericToCartesian(mapPointToCoordinate(v));

const mapCoordinatesFromGeometry = (geometry: SimpleGeometry): Coordinate[] => geometry.getCoordinates()?.[0] ?? [];

export const geometryToCoordinates = (geometry: SimpleGeometry): Coordinate[] =>
  mapCoordinatesFromGeometry(geometry).map(mapPointToCoordinate);

export const geometryToCartesian = (geometry: SimpleGeometry): ICartesianCoords[] =>
  mapCoordinatesFromGeometry(geometry).map(mapPointToCartesian);

/** =========================================================== */

export const isGeoJsonPolygonal = (f: GeoJSONFeature): boolean => {
  const type = f.geometry.type;
  return type === "Polygon" || type === "MultiPolygon";
};

export const GeoJsonFromFeature = (feature: FeatureLike): GeoJSONFeature => {
  const writer = new GeoJSON();
  return writer.writeFeatureObject(feature as olFeature<olGeometry>);
};

export const GeoJsonFromGeometry = (geometry: olGeometry): GeoJSONFeature =>
  GeoJsonFromFeature(new olFeature(geometry));

export const lineStringFromFlatCoords = (coords: number[]): Feature<LineString> => {
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: chunk(coords, 2),
    },
    properties: {},
  };
};

export const polygonFromCoords = (coordinates: number[][]): Feature<Polygon> => {
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coordinates as Position[]],
    },
    properties: {},
  };
};

export const getFeatureId = (f: number | FeatureLike | RenderFeature): number =>
  typeof f === "number" ? f : (f.get("id") as number);

export const getClickedFeatureId = (cf: ClickedFeature): number => getFeatureId(cf.feature);

export const clickedFeatureFilter = (field: string, values: unknown | unknown[]) => (clicked: ClickedFeature) =>
  castArray(values).includes(clicked.feature.get(field));
