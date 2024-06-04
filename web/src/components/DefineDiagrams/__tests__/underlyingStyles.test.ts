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
      expect(style.getStroke().getColor()).toBe(MapColors.black);
      expect(style.getStroke().getWidth()).toBe(0.5);
      expect(style.getStroke().getLineDash()).toBeNull();
    });

    it("should return orange outline for secondary parcels", () => {
      const feature = new Feature({
        toc_code: "SECO",
        parcel_intent: "LEGL",
        status: "CURR",
      });
      const style = underlyingParcelStyles(feature);

      expect(style.getFill().getColor()).toBe(MapColors.transparent);
      expect(style.getStroke().getColor()).toBe(MapColors.orange2);
      expect(style.getStroke().getWidth()).toBe(1);
      expect(style.getStroke().getLineDash()).toBeNull();
    });

    it("should return dark orange outline for tertiary parcels", () => {
      const feature = new Feature({
        toc_code: "TERT",
        parcel_intent: "LEGL",
        status: "CURR",
      });
      const style = underlyingParcelStyles(feature);

      expect(style.getFill().getColor()).toBe(MapColors.transparent);
      expect(style.getStroke().getColor()).toBe(MapColors.orangeDark2);
      expect(style.getStroke().getWidth()).toBe(1);
      expect(style.getStroke().getLineDash()).toBeNull();
    });

    it("should return black outline for strata parcels", () => {
      const feature = new Feature({
        toc_code: "STRA",
        parcel_intent: "LEGL",
        status: "CURR",
      });
      const style = underlyingParcelStyles(feature);

      expect(style.getFill().getColor()).toBe(MapColors.transparent);
      expect(style.getStroke().getColor()).toBe(MapColors.black);
      expect(style.getStroke().getWidth()).toBe(0.5);
      expect(style.getStroke().getLineDash()).toBeNull();
    });

    it("should return orange outline for secondary centerline parcels", () => {
      const feature = new Feature({
        toc_code: "SECL",
        parcel_intent: "LEGL",
        status: "CURR",
      });
      const style = underlyingParcelStyles(feature);

      expect(style.getFill().getColor()).toBe(MapColors.transparent);
      expect(style.getStroke().getColor()).toBe(MapColors.orange2);
      expect(style.getStroke().getWidth()).toBe(1);
      expect(style.getStroke().getLineDash()).toBeNull();
    });

    it("should return red dashed outline for tertiary centerline parcels", () => {
      const feature = new Feature({
        toc_code: "TECL",
        parcel_intent: "LEGL",
        status: "CURR",
      });
      const style = underlyingParcelStyles(feature);

      expect(style.getFill().getColor()).toBe(MapColors.transparent);
      expect(style.getStroke().getColor()).toBe(MapColors.red);
      expect(style.getStroke().getWidth()).toBe(1);
      expect(style.getStroke().getLineDash()).toStrictEqual([3]);
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

    it("should return black outline by default", () => {
      const feature = new Feature({
        toc_code: "???",
        parcel_intent: "???",
        status: "CURR",
      });
      const style = underlyingParcelStyles(feature);

      expect(style.getFill().getColor()).toBe(MapColors.transparent);
      expect(style.getStroke().getColor()).toBe(MapColors.black);
      expect(style.getStroke().getWidth()).toBe(0.5);
      expect(style.getStroke().getLineDash()).toBeNull();
    });
  });
});
