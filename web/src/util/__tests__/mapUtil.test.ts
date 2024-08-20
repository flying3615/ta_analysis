import { CartesianCoordsDTO } from "@linz/survey-plan-generation-api-client";
import { Feature } from "ol";
import Geometry from "ol/geom/Geometry";
import { Layer } from "ol/layer";
import RenderFeature from "ol/render/Feature";
import { Source } from "ol/source";

import {
  cartesianToNumeric,
  clickedFeatureFilter,
  getClickedFeatureId,
  getFeatureId,
  mapPointToCartesian,
  mapPointToCoordinate,
  normalizeLongitude,
  numericToCartesian,
  validatePolygonArea,
} from "@/util/mapUtil.ts";

describe("Longitude normalization calculation", () => {
  test("returns longitude which should be in the range of -180 to 180 when it crosses the dateline", () => {
    expect(normalizeLongitude(10)).toBe(10);
    expect(normalizeLongitude(-336)).toBe(24);
    expect(normalizeLongitude(190)).toBe(-170);
  });
});

describe("mapUtil", () => {
  test("cartesianToNumeric", () => {
    expect(cartesianToNumeric({ x: 10, y: 2 })).toEqual([10, 2]);
  });

  test("numericToCartesian", () => {
    expect(numericToCartesian([10, 2])).toEqual({ x: 10, y: 2 });
  });

  test("mapPointToCoordinates", () => {
    expect(mapPointToCoordinate([19034608.7753906, -5632300.24483069])).toEqual([
      10.990799901689423, -45.068426287007306,
    ]);
  });

  test("mapPointToCartesian", () => {
    expect(mapPointToCartesian([19034608.7753906, -5632300.24483069])).toEqual({
      x: 10.990799901689423,
      y: -45.068426287007306,
    });
  });

  test("getFeatureId", () => {
    const feature = new Feature<Geometry>({ id: 100 });
    expect(getFeatureId(feature)).toBe(100);
    expect(getFeatureId(99)).toBe(99);
    const renderFeature = new RenderFeature("Point", [0, 1], [0], { id: 98 }, "ol1234");
    expect(getFeatureId(renderFeature)).toBe(98);
  });

  test("getClickedFeatureId", () => {
    const feature = new Feature<Geometry>({ id: 100 });
    expect(getClickedFeatureId({ layer: {} as Layer<Source>, feature, distance: 0 })).toBe(100);
  });

  test("clickedFeatureFilter", () => {
    const clickedFeature = {
      layer: {} as Layer<Source>,
      feature: new Feature<Geometry>({ id: 100, x: "hello" }),
      distance: 0,
    };
    const filterForHello = clickedFeatureFilter("x", "hello");
    expect(filterForHello(clickedFeature)).toBe(true);
    const filterForHelloArray = clickedFeatureFilter("x", ["something", "hello"]);
    expect(filterForHelloArray(clickedFeature)).toBe(true);
    const filterNotForHello = clickedFeatureFilter("x", "there");
    expect(filterNotForHello(clickedFeature)).toBe(false);
  });
});

describe("validatePolygonArea", () => {
  const validPolygon: CartesianCoordsDTO[] = [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 0 },
    { x: 0, y: 0 },
  ];

  const invalidPolygon: CartesianCoordsDTO[] = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ];

  test("should return valid area for a square", () => {
    const result = validatePolygonArea(validPolygon);
    expect(result.hasArea).toBe(true);
    expect(result.areaValue).toBeCloseTo(1, 6);
  });

  test("should return hasArea false for area less than minimum", () => {
    const result = validatePolygonArea(validPolygon, 2);
    expect(result.hasArea).toBe(false);
    expect(result.areaValue).toBeCloseTo(1, 6);
  });

  test("should handle invalid polygon (less than 3 unique points)", () => {
    const result = validatePolygonArea(invalidPolygon);
    expect(result.hasArea).toBe(false);
    expect(result.areaValue).toBeFalsy();
  });

  test("should handle empty coordinate array", () => {
    const result = validatePolygonArea([]);
    expect(result.hasArea).toBe(false);
    expect(result.areaValue).toBeFalsy();
  });
});
