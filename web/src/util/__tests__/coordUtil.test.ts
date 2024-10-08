import { coordDimensions, flattenCoords } from "@/util/coordUtil.ts";

describe("flattenCoords", () => {
  test("Wraps a single point", () => {
    expect(flattenCoords([1, 2])).toEqual([[1, 2]]);
  });
  test("Passes through a line", () => {
    expect(
      flattenCoords([
        [1, 2],
        [3, 4],
      ]),
    ).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });
  test("Flattens a multiline or polygon", () => {
    expect(
      flattenCoords([
        [
          [1, 2],
          [3, 4],
        ],
        [
          [5, 6],
          [7, 8],
        ],
      ]),
    ).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
    ]);
  });
  test("Flattens a multipolygon", () => {
    expect(
      flattenCoords([
        [
          [
            [1, 2],
            [3, 4],
            [5, 6],
            [1, 2],
          ],
        ],
        [
          [
            [10, 11],
            [12, 13],
            [14, 15],
          ],
        ],
      ]),
    ).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
      [1, 2],
      [10, 11],
      [12, 13],
      [14, 15],
    ]);
  });
});

describe("coordDimensions", () => {
  test("calculates width and height of a pointset", () => {
    const dims = coordDimensions([
      [10, -45],
      [10.5, -45],
      [10.5, -46],
      [10, -46],
      [10, -45],
    ]);
    expect(dims[0]).toBe(0.5);
    expect(dims[1]).toBe(1.0);
  });
});
