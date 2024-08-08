import { ICartesianCoords } from "@linz/survey-plan-generation-api-client";
import { ClickedFeature } from "@linzjs/landonline-openlayers-map";
import { Feature, LineString } from "geojson";
import { castArray, chunk } from "lodash-es";
import FeatureLike from "ol/Feature";
import RenderFeature from "ol/render/Feature";
import proj4 from "proj4";

export const metersToGeogs = (point: number[]): number[] => {
  return proj4("EPSG:3857", "EPSG:1", point);
};

/**
 * calculates the longitude which should be between -180 to 180
 * Landonline DB does not store real coordinate so need to apply 160 longitude shift.
 * For outer island's data, when we apply 160 longitude shift the resulting longitude is -336 which is not ideal
 * This utility is used to calculate the longitude to be in the range of -180 and +180
 * @param longitude
 */
export const calculateLongitude = (longitude: number): number =>
  longitude < -180 ? longitude + 360 : longitude > 180 ? longitude - 360 : longitude;

export const flatCoordsToGeogCoords = (pointList: number[]): ICartesianCoords[] =>
  chunk(pointList, 2)
    .map(metersToGeogs)
    .map(([x, y]) => ({ x: calculateLongitude(x!), y }) as ICartesianCoords);

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

export const getFeatureId = (f: number | FeatureLike | RenderFeature): number =>
  typeof f === "number" ? f : (f.get("id") as number);

export const getClickedFeatureId = (cf: ClickedFeature): number => getFeatureId(cf.feature);

export const clickedFeatureFilter = (field: string, values: unknown | unknown[]) => (clicked: ClickedFeature) =>
  castArray(values).includes(clicked.feature.get(field));
