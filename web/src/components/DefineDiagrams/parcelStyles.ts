import { Fill, Stroke, Style } from "ol/style";
import { FeatureLike } from "ol/Feature";
import { StyleContext } from "@linzjs/landonline-openlayers-map";
import { COLORS } from "./mapColors";
import { ParcelIntentCode } from "@linz/luck-syscodes/build/js/ParcelIntentCode";

const createParcelStyle = (fillColor: string, strokeColor: string, strokeWidth: number, lineDash?: number) => {
  return new Style({
    fill: new Fill({
      color: fillColor,
    }),
    stroke: new Stroke({
      color: strokeColor,
      width: strokeWidth,
      lineDash: lineDash ? [lineDash] : undefined,
    }),
  });
};

const roadParcelStyle = createParcelStyle(COLORS.transparent, COLORS.midGrey, 1.5, 3);
const hydroParcelStyle = createParcelStyle(COLORS.transparent, COLORS.midGrey, 1.5, 3);
const primParcelStyle = createParcelStyle(COLORS.transparent, COLORS.black, 3);

const nonPrimParcelStyle = createParcelStyle(COLORS.transparent, COLORS.black, 1.5);

const centerLineParcelStyle = createParcelStyle(COLORS.transparent, COLORS.black, 1.5);

/**
 * From `vtParcelStyleFunction()` in `web/src/map-styles/vectorTileStyle.ts` in Survey Capture, with following changes
 * which are tailored for plan gen:
 * - remove HIST (historic) parcel styles as they are not expected
 * - remove APPR (approved) parcel styles as they are not expected
 * - consolidated non-primary parcel styles
 * - consolidated centerline parcel styles
 */
export const parcelStyles = (feature: FeatureLike, _: number, _styleContext?: StyleContext): Style => {
  const parcelIntent = feature.get("parcelIntent");
  const parcelTopologyClass = feature.get("topoClass");

  switch (parcelTopologyClass) {
    case "PRIM": {
      switch (parcelIntent) {
        case ParcelIntentCode.ROAD: {
          return roadParcelStyle;
        }
        case ParcelIntentCode.HYDR: {
          return hydroParcelStyle;
        }
        default: {
          return primParcelStyle;
        }
      }
    }

    // non-primary new/captured parcels
    case "SECO":
    case "TERT": {
      return nonPrimParcelStyle;
    }

    // non-primary centerline parcels
    case "SECL":
    case "TECL": {
      return centerLineParcelStyle;
    }

    // strata parcel (height limited) - will likely have own styling in future
    case "STRA": {
      return primParcelStyle;
    }

    default: {
      return primParcelStyle;
    }
  }
};
