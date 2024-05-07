import {
  IFeatureSource,
  LayerType,
  LolOpenLayersFeatureSourceDef,
  LolOpenLayersMapLibreSourceDef,
  LolOpenLayersTileLayerDef,
  LolOpenLayersVectorLayerDef,
  SourceType,
} from "@linzjs/landonline-openlayers-map";
import { markStyleFunction } from "./markStyles";

const linzCC4Attrib = "© Toitū Te Whenua - CC BY 4.0";

export const BASEMAP_LAYER_NAME = "linz_basemap";
export const MARKS_LAYER_NAME = "marks";

const zIndexes: Record<string, number> = {
  MARKS_LAYER_NAME: 100,
};

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

export const marksLayer = (marksData: IFeatureSource[], maxZoom: number): LolOpenLayersVectorLayerDef => {
  return {
    name: MARKS_LAYER_NAME,
    type: LayerType.VECTOR,
    visible: true,
    inInitialZoom: true,
    declutterLabels: true,
    togglable: false,
    zIndex: zIndexes[MARKS_LAYER_NAME],
    style: markStyleFunction,
    source: {
      type: SourceType.FEATURES,
      data: marksData,
      maxZoom,
      projection: "EPSG:4326",
    } as LolOpenLayersFeatureSourceDef,
  } as LolOpenLayersVectorLayerDef;
};
