import { MapColors } from "../mapColors";
import { underlyingParcelStyles } from "../underlyingStyles";
import { Feature } from "ol";
import { Style } from "ol/style";

describe("underlyingStyles", () => {
  describe("underlyingParcelStyles", () => {
    it("should return yellow semi-transparent parcel with black outline for primary road parcels", () => {
      const feature = new Feature({
        toc_code: "PRIM",
        parcel_intent: "ROAD",
        status: "CURR",
      });
      const style = underlyingParcelStyles(feature);

      expect(style.getFill().getColor()).toBe(MapColors.yellowOpacity50);
      expect(style.getStroke().getColor()).toBe(MapColors.black);
      expect(style.getStroke().getWidth()).toBe(0.5);
      expect(style.getStroke().getLineDash()).toBeNull();
    });

    it("should return cyan parcel with black outline for primary hydro parcels", () => {
      const feature = new Feature({
        toc_code: "PRIM",
        parcel_intent: "HYDR",
        status: "CURR",
      });
      const style = underlyingParcelStyles(feature);

      expect(style.getFill().getColor()).toBe(MapColors.cyan);
      expect(style.getStroke().getColor()).toBe(MapColors.black);
      expect(style.getStroke().getWidth()).toBe(0.5);
      expect(style.getStroke().getLineDash()).toBeNull();
    });

    it("should return black outline for primary parcels", () => {
      const feature = new Feature({
        toc_code: "PRIM",
        parcel_intent: "LEGL",
        status: "CURR",
      });
      const style = underlyingParcelStyles(feature);

      expect(style.getFill().getColor()).toBe(MapColors.transparent);
      expect(style.getStroke().getColor()).toBe(MapColors.midGray);
      expect(style.getStroke().getWidth()).toBe(1);
      expect(style.getStroke().getLineDash()).toEqual([2, 7]);
    });
    it("should not show any styling for historical parcels", () => {
      const feature = new Feature({
        toc_code: "TECL",
        parcel_intent: "LEGL",
        status: "HIST",
      });
      const style = underlyingParcelStyles(feature);

      expect(style).toStrictEqual(new Style());
    });
  });
});
