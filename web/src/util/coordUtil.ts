import { flattenDepth, isArray } from "lodash-es";

export type GeometryCoords = number[] | number[][] | number[][][] | number[][][][] | number[][][][][];

function isArrayOfNumber(a: GeometryCoords | number | undefined) {
  return a && isArray(a) && typeof a[0] == "number";
}

/**
 ** Flatten a nested array of coordinates of depth up to 4 (multipolygon)
 ** into a pointset array of coordinates, depth 1
 */
export const flattenCoords = (a: GeometryCoords): number[][] => {
  if (isArrayOfNumber(a)) {
    // single point, we unflatten to array of one point
    return [a] as number[][];
  }

  if (isArray(a) && isArrayOfNumber(a[0])) {
    return a as number[][];
  }
  return flattenCoords(flattenDepth(a, 1) as GeometryCoords);
};

export const coordDimensions = (a: number[][]): [number, number] => {
  if (a.length === 0) {
    return [0, 0];
  }

  const valueColumns = [0, 1].map((i) => a.map((row) => row[i] ?? 0));
  const minValues = valueColumns.map((col) => Math.min(...col)) as [number, number];
  const maxValues = valueColumns.map((col) => Math.max(...col)) as [number, number];
  return [maxValues[0] - minValues[0], maxValues[1] - minValues[1]];
};
