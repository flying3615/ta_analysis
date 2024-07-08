import { ParcelIntentCode } from "@linz/luck-syscodes/build/js/ParcelIntentCode";
import { StyleContext } from "@linzjs/landonline-openlayers-map";
import { FeatureLike } from "ol/Feature";
import { Fill, Stroke, Style } from "ol/style";

import { MapColors } from "./mapColors";

export const createParcelStyle = (
  fillColor: string,
  strokeColor: string,
  strokeWidth: number,
  lineDash?: number[] | undefined,
) => {
  return new Style({
    fill: new Fill({
      color: fillColor,
    }),
    stroke: new Stroke({
      color: strokeColor,
      width: strokeWidth,
      lineDash: lineDash,
    }),
  });
};

const roadParcelStyle = createParcelStyle(MapColors.transparent, MapColors.midGray, 1.5, [3]);
const hydroParcelStyle = createParcelStyle(MapColors.transparent, MapColors.midGray, 1.5, [3]);
const primParcelStyle = createParcelStyle(MapColors.transparent, MapColors.black, 3);

const nonPrimParcelStyle = createParcelStyle(MapColors.transparent, MapColors.black, 1.5);

const centerLineParcelStyle = createParcelStyle(MapColors.transparent, MapColors.black, 1.5);

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
