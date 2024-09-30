import { Feature } from "ol";
import Geometry from "ol/geom/Geometry";
import { Layer } from "ol/layer";
import OlMap from "ol/Map";
import RenderFeature from "ol/render/Feature";
import { Source } from "ol/source";

import {
  cartesianToNumeric,
  clickedFeatureFilter,
  getClickedFeatureId,
  getFeatureId,
  mapZoomScale,
  metersToLatLongCartesian,
  metersToLatLongCoordinate,
  normalizeLongitude,
  numericToCartesian,
  pixelsToMeters,
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
    expect(metersToLatLongCoordinate([19034608.7753906, -5632300.24483069])).toEqual([
      10.990799901689423, -45.068426287007306,
    ]);
  });

  test("mapPointToCartesian", () => {
    expect(metersToLatLongCartesian([19034608.7753906, -5632300.24483069])).toEqual({
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

  test("pixelsToMeters", () => {
    expect(pixelsToMeters(0)).toBe(0);
    expect(pixelsToMeters(10000000)).toBe(2645.833333333334);
  });

  test("mapZoomScale", () => {
    const map = {
      getView: () => ({
        calculateExtent: () => [10, 5, 100, 200],
      }),
      getViewport: () => ({
        getBoundingClientRect: () => ({ width: 900 }),
      }),
    } as unknown as OlMap;
    expect(mapZoomScale(map)).toBe(377);
  });
});
