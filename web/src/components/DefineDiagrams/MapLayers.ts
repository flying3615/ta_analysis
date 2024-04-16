import {
  LayerType,
  LolOpenLayersMapLibreSourceDef,
  LolOpenLayersTileLayerDef,
  SourceType,
} from "@linzjs/landonline-openlayers-map";

const linzCC4Attrib = "© Toitū Te Whenua - CC BY 4.0";

export const BASEMAP_LAYER_NAME = "linz_basemap";

export const linzMLBasemapLayer = (maxZoom: number) => {
  const basemapApiKey = window._env_.basemapApiKey;

  return {
    name: BASEMAP_LAYER_NAME,
    type: LayerType.TILE,
    visible: true,
    source: {
      type: SourceType.MAP_LIBRE,
      url: `https://basemaps.linz.govt.nz/v1/tiles/topographic/EPSG:3857/style/topolite.json?api=${basemapApiKey}`,
      // this layer can only be used up to zoom 24 or errors are thrown by maplibre-gl-js
      maxZoom: maxZoom > 24 ? 24 : maxZoom,
      attributions: linzCC4Attrib,
      excludeLayers: ["Buildings", "Buildings-Outline", "Housenumber"],
      preserveDrawingBuffer: true,
    } as LolOpenLayersMapLibreSourceDef,
  } as LolOpenLayersTileLayerDef;
};
