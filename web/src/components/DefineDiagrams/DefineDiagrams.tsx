import { LolOpenLayersMap } from "@linzjs/landonline-openlayers-map";
import { linzMLBasemapLayer } from "@/components/DefineDiagrams/MapLayers.ts";
import { ReactNode } from "react";
import "./DefineDiagrams.scss";

export const DefineDiagrams = (props: { mock?: boolean; children?: ReactNode }) => {
  const maxZoom = 24;

  return (
    <div className="DefineDiagrams">
      <LolOpenLayersMap
        view={{ projection: "EPSG:3857", center: [19457143.791, -5057154.019], zoom: 16, maxZoom }}
        bufferFactor={1.2}
        mock={props.mock}
        layers={[linzMLBasemapLayer(maxZoom)]}
      />
      {props.children}
    </div>
  );
};
