import {
  IFeatureSource,
  LayerType,
  LolOpenLayersFeatureSourceDef,
  LolOpenLayersMapLibreSourceDef,
  LolOpenLayersMVTSourceDef,
  LolOpenLayersTileLayerDef,
  LolOpenLayersVectorLayerDef,
  LolOpenLayersVectorTileLayerDef,
  SourceType,
} from "@linzjs/landonline-openlayers-map";
import { markStyleFunction } from "./markStyles";
import { parcelStyles } from "./parcelStyles";
import { vectorStyles } from "@/components/DefineDiagrams/vectorStyles.ts";
import { underlyingParcelStyles, vtRoadsCentrelineStyleFunction } from "./underlyingStyles";
import { diagramStyles } from "@/components/DefineDiagrams/diagramStyles.ts";

const linzCC4Attrib = "© Toitū Te Whenua - CC BY 4.0";

export const BASEMAP_LAYER_NAME = "linz_basemap";
export const UNDERLYING_PARCELS_LAYER_NAME = "viw_parcel_all";
export const MARKS_LAYER_NAME = "marks";
export const PARCELS_LAYER_NAME = "parcels";
export const VECTORS_LAYER_NAME = "vectors";
export const DIAGRAMS_LAYER_NAME = "diagrams";
export const UNDERLYING_ROAD_CENTER_LINE_LAYER_NAME = "viw_rap_road_ctr_line";

const zIndexes: Record<string, number> = {
  DIAGRAMS_LAYER_NAME: 50,
  MARKS_LAYER_NAME: 2,
  PARCELS_LAYER_NAME: 1,
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
      excludeLayers: ["Parcels-Ln", "Buildings", "Buildings-Outline", "Housenumber"],
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
    } as LolOpenLayersFeatureSourceDef,
  } as LolOpenLayersVectorLayerDef;
};

export const parcelsLayer = (parcelsData: IFeatureSource[], maxZoom: number): LolOpenLayersVectorLayerDef => {
  return {
    name: PARCELS_LAYER_NAME,
    type: LayerType.VECTOR,
    visible: true,
    inInitialZoom: true,
    declutterLabels: false,
    togglable: false,
    zIndex: zIndexes[PARCELS_LAYER_NAME],
    style: parcelStyles,
    source: {
      type: SourceType.FEATURES,
      data: parcelsData,
      maxZoom,
    } as LolOpenLayersFeatureSourceDef,
  } as LolOpenLayersVectorLayerDef;
};

export const vectorsLayer = (data: IFeatureSource[], maxZoom: number): LolOpenLayersVectorLayerDef => {
  return {
    name: VECTORS_LAYER_NAME,
    type: LayerType.VECTOR,
    visible: true,
    inInitialZoom: true,
    declutterLabels: true,
    togglable: false,
    zIndex: zIndexes[VECTORS_LAYER_NAME],
    style: vectorStyles,
    source: {
      type: SourceType.FEATURES,
      data,
      maxZoom,
    } as LolOpenLayersFeatureSourceDef,
  } as LolOpenLayersVectorLayerDef;
};

export const diagramsLayer = (data: IFeatureSource[], maxZoom: number): LolOpenLayersVectorLayerDef => {
  return {
    name: DIAGRAMS_LAYER_NAME,
    type: LayerType.VECTOR,
    visible: true,
    inInitialZoom: true,
    declutterLabels: true,
    togglable: false,
    zIndex: zIndexes[DIAGRAMS_LAYER_NAME],
    style: diagramStyles,
    source: {
      type: SourceType.FEATURES,
      data,
      maxZoom,
    } as LolOpenLayersFeatureSourceDef,
  } as LolOpenLayersVectorLayerDef;
};

export const underlyingParcelsLayer = (maxZoom: number): LolOpenLayersVectorLayerDef => {
  const { apiGatewayBaseUrl } = window._env_;
  return {
    name: UNDERLYING_PARCELS_LAYER_NAME,
    type: LayerType.VECTOR_TILE,
    visible: true,
    maxResolution: 10,
    style: underlyingParcelStyles,
    source: {
      type: SourceType.MVT,
      url: `${apiGatewayBaseUrl}/v1/generate-plans/tiles/${UNDERLYING_PARCELS_LAYER_NAME}/{z}/{x}/{-y}`,
      maxZoom: maxZoom > 30 ? 30 : maxZoom, // maximum Level for Tile Matrix Set of EPSG:900913
    } as LolOpenLayersMVTSourceDef,
  } as LolOpenLayersVectorTileLayerDef;
};

export const underlyingRoadCentreLine = (maxZoom: number): LolOpenLayersVectorLayerDef => {
  const { apiGatewayBaseUrl } = window._env_;
  return {
    name: UNDERLYING_ROAD_CENTER_LINE_LAYER_NAME,
    type: LayerType.VECTOR_TILE,
    visible: true,
    maxResolution: 10,
    style: vtRoadsCentrelineStyleFunction,
    source: {
      type: SourceType.MVT,
      url: `${apiGatewayBaseUrl}/v1/generate-plans/tiles/${UNDERLYING_ROAD_CENTER_LINE_LAYER_NAME}/{z}/{x}/{-y}`,
      maxZoom: maxZoom > 30 ? 30 : maxZoom, // maximum Level for Tile Matrix Set of EPSG:900913
    } as LolOpenLayersMVTSourceDef,
  } as LolOpenLayersVectorTileLayerDef;
};
