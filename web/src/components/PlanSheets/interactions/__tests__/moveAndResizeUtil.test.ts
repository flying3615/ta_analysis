import {
  BoundingBox,
  getResizeLimits,
  moveExtent,
  Resize,
  resizeExtent,
  ResizeLimits,
  scaleExtent,
} from "../moveAndResizeUtil";

describe("moveAndResizeUtil", () => {
  // 12x24, different values for each
  const TEST_EXTENT: BoundingBox = {
    x1: 12,
    x2: 24,
    y1: 36,
    y2: 60,
  };

  // 12/24/36/48 around TEST_EXTENT
  const TEST_LIMITS: BoundingBox = {
    x1: TEST_EXTENT.x1 - 12,
    x2: TEST_EXTENT.x2 + 24,
    y1: TEST_EXTENT.y1 - 36,
    y2: TEST_EXTENT.y2 + 48,
  };

  const TEST_RESIZE_LIMITS: ResizeLimits = {
    maxHeight: 36,
    maxWidth: 24,
  };

  describe("getResizeLimits", () => {
    it("should anchor NW to SE", () => {
      expect(getResizeLimits(TEST_EXTENT, Resize.NW, [TEST_LIMITS])).toStrictEqual({
        maxHeight: TEST_EXTENT.y2 - TEST_LIMITS.y1,
        maxWidth: TEST_EXTENT.x2 - TEST_LIMITS.x1,
      });
    });

    it("should anchor NE to SW", () => {
      expect(getResizeLimits(TEST_EXTENT, Resize.NE, [TEST_LIMITS])).toStrictEqual({
        maxHeight: TEST_EXTENT.y2 - TEST_LIMITS.y1,
        maxWidth: TEST_LIMITS.x2 - TEST_EXTENT.x1,
      });
    });

    it("should anchor SW to NE", () => {
      expect(getResizeLimits(TEST_EXTENT, Resize.SW, [TEST_LIMITS])).toStrictEqual({
        maxHeight: TEST_LIMITS.y2 - TEST_EXTENT.y1,
        maxWidth: TEST_EXTENT.x2 - TEST_LIMITS.x1,
      });
    });

    it("should anchor SE to NW", () => {
      expect(getResizeLimits(TEST_EXTENT, Resize.SE, [TEST_LIMITS])).toStrictEqual({
        maxHeight: TEST_LIMITS.y2 - TEST_EXTENT.y1,
        maxWidth: TEST_LIMITS.x2 - TEST_EXTENT.x1,
      });
    });

    it("should anchor E to W center", () => {
      expect(getResizeLimits(TEST_EXTENT, Resize.E, [TEST_LIMITS])).toStrictEqual({
        maxHeight: TEST_EXTENT.y1 + TEST_EXTENT.y2 - 2 * TEST_LIMITS.y1,
        maxWidth: TEST_LIMITS.x2 - TEST_EXTENT.x1,
      });
    });

    it("should anchor W to E center", () => {
      expect(getResizeLimits(TEST_EXTENT, Resize.W, [TEST_LIMITS])).toStrictEqual({
        maxHeight: TEST_EXTENT.y1 + TEST_EXTENT.y2 - 2 * TEST_LIMITS.y1,
        maxWidth: TEST_EXTENT.x2 - TEST_LIMITS.x1,
      });
    });

    it("should anchor N to S center", () => {
      expect(getResizeLimits(TEST_EXTENT, Resize.N, [TEST_LIMITS])).toStrictEqual({
        maxHeight: TEST_EXTENT.y2 - TEST_LIMITS.y1,
        maxWidth: TEST_EXTENT.x1 + TEST_EXTENT.x2 - 2 * TEST_LIMITS.x1,
      });
    });

    it("should anchor S to N center", () => {
      expect(getResizeLimits(TEST_EXTENT, Resize.S, [TEST_LIMITS])).toStrictEqual({
        maxHeight: TEST_LIMITS.y2 - TEST_EXTENT.y1,
        maxWidth: TEST_EXTENT.x1 + TEST_EXTENT.x2 - 2 * TEST_LIMITS.x1,
      });
    });
  });

  describe("moveExtent", () => {
    it("should move extent within limits", () => {
      expect(moveExtent(TEST_EXTENT, 10, 10, TEST_LIMITS)).toStrictEqual({
        x1: TEST_EXTENT.x1 + 10,
        x2: TEST_EXTENT.x2 + 10,
        y1: TEST_EXTENT.y1 + 10,
        y2: TEST_EXTENT.y2 + 10,
      });
    });

    it("should constrain top and left", () => {
      expect(moveExtent(TEST_EXTENT, -100, -100, TEST_LIMITS)).toStrictEqual({
        ...TEST_LIMITS,
        x2: TEST_LIMITS.x1 + 12,
        y2: TEST_LIMITS.y1 + 24,
      });
    });

    it("should contrain bottom and right", () => {
      expect(moveExtent(TEST_EXTENT, 100, 100, TEST_LIMITS)).toStrictEqual({
        ...TEST_LIMITS,
        x1: TEST_LIMITS.x2 - 12,
        y1: TEST_LIMITS.y2 - 24,
      });
    });
  });

  describe("resizeExtent", () => {
    it("should prevent resizing too small", () => {
      expect(resizeExtent(TEST_EXTENT, Resize.SE, -100, -100, { minHeight: 12 })).toStrictEqual({
        ...TEST_EXTENT,
        x2: TEST_EXTENT.x1 + 6,
        y2: TEST_EXTENT.y1 + 12,
      });
    });

    it("should prevent resizing too large", () => {
      expect(
        resizeExtent(TEST_EXTENT, Resize.SW, -100, 100, { minHeight: 12, maxWidth: 200, maxHeight: 50 }),
      ).toStrictEqual({
        ...TEST_EXTENT,
        x1: TEST_EXTENT.x2 - 25,
        y2: TEST_EXTENT.y1 + 50,
      });
    });

    it("should anchor NW to SE", () => {
      expect(resizeExtent(TEST_EXTENT, Resize.NW, -12, -12)).toStrictEqual({
        ...TEST_EXTENT,
        x1: TEST_EXTENT.x1 - 12,
        y1: TEST_EXTENT.y1 - 24,
      });
    });

    it("should anchor NE to SW", () => {
      expect(resizeExtent(TEST_EXTENT, Resize.NE, 12, -12)).toStrictEqual({
        ...TEST_EXTENT,
        x2: TEST_EXTENT.x2 + 12,
        y1: TEST_EXTENT.y1 - 24,
      });
    });

    it("should anchor SW to NE", () => {
      expect(resizeExtent(TEST_EXTENT, Resize.SW, -12, 12)).toStrictEqual({
        ...TEST_EXTENT,
        x1: TEST_EXTENT.x1 - 12,
        y2: TEST_EXTENT.y2 + 24,
      });
    });

    it("should anchor SE to NW", () => {
      expect(resizeExtent(TEST_EXTENT, Resize.SE, 12, 12)).toStrictEqual({
        ...TEST_EXTENT,
        x2: TEST_EXTENT.x2 + 12,
        y2: TEST_EXTENT.y2 + 24,
      });
    });

    it("should anchor E to W center", () => {
      expect(resizeExtent(TEST_EXTENT, Resize.E, 12, 100)).toStrictEqual({
        ...TEST_EXTENT,
        x2: TEST_EXTENT.x2 + 12,
        y1: TEST_EXTENT.y1 - 12,
        y2: TEST_EXTENT.y2 + 12,
      });
    });

    it("should anchor W to E center", () => {
      expect(resizeExtent(TEST_EXTENT, Resize.W, -12, 100)).toStrictEqual({
        ...TEST_EXTENT,
        x1: TEST_EXTENT.x1 - 12,
        y1: TEST_EXTENT.y1 - 12,
        y2: TEST_EXTENT.y2 + 12,
      });
    });

    it("should anchor N to S center", () => {
      expect(resizeExtent(TEST_EXTENT, Resize.N, 100, -12)).toStrictEqual({
        ...TEST_EXTENT,
        x1: TEST_EXTENT.x1 - 3,
        x2: TEST_EXTENT.x2 + 3,
        y1: TEST_EXTENT.y1 - 12,
      });
    });

    it("should anchor S to N center", () => {
      expect(resizeExtent(TEST_EXTENT, Resize.S, 100, 12)).toStrictEqual({
        ...TEST_EXTENT,
        x1: TEST_EXTENT.x1 - 3,
        x2: TEST_EXTENT.x2 + 3,
        y2: TEST_EXTENT.y2 + 12,
      });
    });
  });

  describe("scaleExtent", () => {
    it("should preserve aspect ratio", () => {
      expect(scaleExtent(TEST_EXTENT, Resize.NW, -6, -5)).toStrictEqual({
        h: TEST_EXTENT.y2 - TEST_EXTENT.y1 + 12,
        w: TEST_EXTENT.x2 - TEST_EXTENT.x1 + 6,
      });
    });

    it("corner should scale larger of dx/dy inside limits", () => {
      expect(scaleExtent(TEST_EXTENT, Resize.SE, 2, 6, TEST_RESIZE_LIMITS)).toStrictEqual({
        h: TEST_EXTENT.y2 - TEST_EXTENT.y1 + 6,
        w: TEST_EXTENT.x2 - TEST_EXTENT.x1 + 3,
      });
      expect(scaleExtent(TEST_EXTENT, Resize.SE, 6, 2, TEST_RESIZE_LIMITS)).toStrictEqual({
        h: TEST_EXTENT.y2 - TEST_EXTENT.y1 + 12,
        w: TEST_EXTENT.x2 - TEST_EXTENT.x1 + 6,
      });
    });

    it("side should ignore scale of cross-axis", () => {
      expect(scaleExtent(TEST_EXTENT, Resize.E, 2, 6, TEST_RESIZE_LIMITS)).toStrictEqual({
        h: TEST_EXTENT.y2 - TEST_EXTENT.y1 + 4,
        w: TEST_EXTENT.x2 - TEST_EXTENT.x1 + 2,
      });
      expect(scaleExtent(TEST_EXTENT, Resize.S, 6, 2, TEST_RESIZE_LIMITS)).toStrictEqual({
        h: TEST_EXTENT.y2 - TEST_EXTENT.y1 + 2,
        w: TEST_EXTENT.x2 - TEST_EXTENT.x1 + 1,
      });
    });

    it("should scale within limit", () => {
      expect(scaleExtent(TEST_EXTENT, Resize.NE, 15, 30, TEST_RESIZE_LIMITS)).toStrictEqual({
        h: TEST_RESIZE_LIMITS.maxHeight,
        w: TEST_RESIZE_LIMITS.maxHeight! / 2,
      });
    });
  });
});
