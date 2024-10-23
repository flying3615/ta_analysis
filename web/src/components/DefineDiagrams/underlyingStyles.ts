import { ParcelIntentCode } from "@linz/luck-syscodes/build/js/ParcelIntentCode";
import { ParcelStatusCode } from "@linz/luck-syscodes/build/js/ParcelStatusCode";
import { ParcelTopologyClassCode } from "@linz/luck-syscodes/build/js/ParcelTopologyClassCode";
import { FeatureLike } from "ol/Feature";
import { Fill, Stroke, Style, Text } from "ol/style";

import { MapColors } from "./mapColors";
import { createParcelStyle } from "./parcelStyles";

const roadParcelStyle = createParcelStyle(MapColors.yellowOpacity50, MapColors.black, 0.5);
const hydroParcelStyle = createParcelStyle(MapColors.cyan, MapColors.black, 0.5);
const primaryParcelStyle = createParcelStyle(MapColors.transparent, MapColors.midGray, 1, [2, 7]);

const vtRoadsCentrelineStyle = (feature: FeatureLike) => {
  return new Style({
    stroke: new Stroke({
      color: MapColors.white,
      width: 2,
    }),
    text: new Text({
      font: '12px "Open Sans",sans-serif',
      text: feature.get("road_name") as string,
      placement: "line",
      offsetY: -10,
      fill: new Fill({ color: MapColors.black }),
    }),
    zIndex: 1,
  });
};

export const vtRoadsCentrelineStyleFunction = (feature: FeatureLike) => {
  return vtRoadsCentrelineStyle(feature);
};

/**
 * From `vtParcelStyleFunction()` in `web/src/map-styles/vectorTileStyle.ts` in Survey Capture,
 * but for Plan Gen we only show current underlying parcels, not historic/approved/pending/etc.
 */
export const underlyingParcelStyles = (feature: FeatureLike): Style => {
  const parcelIntent = feature.get("parcel_intent") as ParcelIntentCode;
  const parcelTopologyClass = feature.get("toc_code") as ParcelTopologyClassCode;
  const parcelStatus = feature.get("status") as ParcelStatusCode;

  if (parcelStatus !== ParcelStatusCode.CURR) {
    return new Style();
  }

  switch (parcelTopologyClass) {
    case ParcelTopologyClassCode.PRIM: {
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
    default: {
      return new Style({});
    }
  }
};
