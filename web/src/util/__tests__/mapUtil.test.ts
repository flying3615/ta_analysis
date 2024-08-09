import { Feature } from "ol";
import Geometry from "ol/geom/Geometry";
import { Layer } from "ol/layer";
import RenderFeature from "ol/render/Feature";
import { Source } from "ol/source";

import {
  calculateLongitude,
  clickedFeatureFilter,
  getClickedFeatureId,
  getFeatureId,
  lineStringFromFlatCoords,
} from "@/util/mapUtil.ts";

describe("Longitude shift calculation", () => {
  test("returns longitude which should be in the range of -180 to 180 when it crosses the dateline", () => {
    expect(calculateLongitude(10)).toBe(10);
    expect(calculateLongitude(-336)).toBe(24);
    expect(calculateLongitude(190)).toBe(-170);
  });
});

describe("mapUtil", () => {
  test("lineStringFromFlatCoords", () => {
    expect(lineStringFromFlatCoords([1, 2, 3, 4, 5, 6])).toEqual({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [1, 2],
          [3, 4],
          [5, 6],
        ],
      },
      properties: {},
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
