import { Style } from "ol/style";
import { FeatureLike } from "ol/Feature";
import { ParcelIntentCode } from "@linz/luck-syscodes/build/js/ParcelIntentCode";
import { ParcelStatusCode } from "@linz/luck-syscodes/build/js/ParcelStatusCode";
import { MapColors } from "./mapColors";
import { createParcelStyle } from "./parcelStyles";

const roadParcelStyle = createParcelStyle(MapColors.yellowOpacity50, MapColors.black, 0.5);
const hydroParcelStyle = createParcelStyle(MapColors.cyan, MapColors.black, 0.5);
const primaryParcelStyle = createParcelStyle(MapColors.transparent, MapColors.black, 0.5);
const secondaryParcelStyle = createParcelStyle(MapColors.transparent, MapColors.orange2, 1);
const tertiaryParcelStyle = createParcelStyle(MapColors.transparent, MapColors.orangeDark2, 1);
const tertiaryCenterlineParcelStyle = createParcelStyle(MapColors.transparent, MapColors.red, 1, 3);

/**
 * From `vtParcelStyleFunction()` in `web/src/map-styles/vectorTileStyle.ts` in Survey Capture,
 * but for Plan Gen we only show current underlying parcels, not historic/approved/pending/etc.
 */
export const underlyingParcelStyles = (feature: FeatureLike): Style => {
  const parcelIntent = feature.get("parcel_intent");
  const parcelTopologyClass = feature.get("toc_code");
  const parcelStatus = feature.get("status");

  if (parcelStatus !== ParcelStatusCode.CURR) {
    return new Style();
  }

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
          return primaryParcelStyle;
        }
      }
    }

    case "SECO": {
      return secondaryParcelStyle;
    }

    case "TERT": {
      return tertiaryParcelStyle;
    }

    // strata parcel (height limited) - will likely have own styling in future
    case "STRA": {
      return primaryParcelStyle;
    }

    case "SECL": {
      return secondaryParcelStyle;
    }

    case "TECL": {
      return tertiaryCenterlineParcelStyle;
    }

    default: {
      return primaryParcelStyle;
    }
  }
};
