import { calculateLongitude } from "@/util/mapUtil.ts";

describe("Longitude shift calculation", () => {
  test("returns longitude which should be in the range of -180 to 180 when it crosses the dateline", () => {
    expect(calculateLongitude(10)).toBe(10);
    expect(calculateLongitude(-336)).toBe(24);
    expect(calculateLongitude(190)).toBe(-170);
  });
});
