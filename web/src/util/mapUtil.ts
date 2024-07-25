import { ICartesianCoords } from "@linz/survey-plan-generation-api-client";
import { chunk } from "lodash-es";
import proj4 from "proj4";

export const metersToGeogs = (point: number[]): number[] => {
  return proj4("EPSG:3857", "EPSG:1", point);
};

export const flatCoordsToGeogCoords = (pointList: number[]): ICartesianCoords[] => {
  return chunk(pointList, 2)
    .map(metersToGeogs)
    .map(([x, y]) => ({ x, y }) as ICartesianCoords);
};
