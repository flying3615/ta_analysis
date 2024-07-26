import { ICartesianCoords } from "@linz/survey-plan-generation-api-client";
import { chunk } from "lodash-es";
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
