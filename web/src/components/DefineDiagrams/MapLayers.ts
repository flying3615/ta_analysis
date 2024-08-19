import { DiagramLabelsControllerApi, DiagramsControllerApi } from "@linz/survey-plan-generation-api-client";
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

import {
  diagramStyles,
  diagramStylesSelected,
  userDiagramStylesSelectable,
} from "@/components/DefineDiagrams/diagramStyles.ts";
import { getDiagramsForOpenLayers, getLabelsForOpenLayers } from "@/components/DefineDiagrams/featureMapper.ts";
import { labelStyles } from "@/components/DefineDiagrams/labelStyles.ts";
import {
  ctlineSelectableStyles,
  lineStyle_selectable,
  lineStyle_selected,
  lineStyles,
} from "@/components/DefineDiagrams/lineStyles.ts";
import { vectorStyles } from "@/components/DefineDiagrams/vectorStyles.ts";
import { apiConfig } from "@/queries/apiConfig.ts";
import { getDiagramsQueryKey } from "@/queries/diagrams.ts";
import { getExtinguishedLinesQuery, getExtinguishedLinesQueryKey } from "@/queries/extinguished-lines.ts";
import { getLabelsQueryKey } from "@/queries/labels.ts";
import { getLinesQuery, getLinesQueryKey } from "@/queries/lines.ts";

import { markStyleFunction } from "./markStyles";
import { parcelStyles } from "./parcelStyles";
import { underlyingParcelStyles, vtRoadsCentrelineStyleFunction } from "./underlyingStyles";

const linzCC4Attrib = "© Toitū Te Whenua - CC BY 4.0";

export enum Layer {
  BASEMAP = "linz_basemap",
  DIAGRAMS = "diagrams",
  EXTINGUISHED_LINES = "extinguished-lines",
  HEADER = "header",
  LABELS = "labels",
  LINES = "lines",
  MARKS = "marks",
  PARCELS = "parcels",
  PLAN_KEY = "plan-key",
  SELECT_DIAGRAMS = "select-diagrams",
  SELECT_LINES = "select-lines",
  UNDERLYING_PARCELS = "viw_parcel_all",
  UNDERLYING_ROAD_CENTER_LINE = "viw_rap_road_ctr_line",
  VECTORS = "vectors",
}

export const zIndexes: Record<string, number> = {
  [Layer.HEADER]: 201,
  [Layer.PLAN_KEY]: 200,
  [Layer.SELECT_DIAGRAMS]: 100,
  [Layer.SELECT_LINES]: 100,
  [Layer.EXTINGUISHED_LINES]: 100,
  [Layer.LABELS]: 52,
  [Layer.LINES]: 51,
  [Layer.DIAGRAMS]: 50,
  [Layer.MARKS]: 2,
  [Layer.PARCELS]: 1,
};

export const linzMLBasemapLayer = (maxZoom: number) => {
  const basemapApiKey = window._env_.basemapApiKey;

  return {
    name: Layer.BASEMAP,
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
    name: Layer.MARKS,
    type: LayerType.VECTOR,
    visible: true,
    inInitialZoom: true,
    declutterLabels: true,
    togglable: false,
    zIndex: zIndexes[Layer.MARKS],
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
    name: Layer.PARCELS,
    type: LayerType.VECTOR,
    visible: true,
    inInitialZoom: true,
    declutterLabels: false,
    togglable: false,
    zIndex: zIndexes[Layer.PARCELS],
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
    name: Layer.VECTORS,
    type: LayerType.VECTOR,
    visible: true,
    inInitialZoom: true,
    declutterLabels: true,
    togglable: false,
    zIndex: zIndexes[Layer.VECTORS],
    style: vectorStyles,
    source: {
      type: SourceType.FEATURES,
      data,
      maxZoom,
    } as LolOpenLayersFeatureSourceDef,
  } as LolOpenLayersVectorLayerDef;
};

// Old diagrams code
export const diagramsLayer = (data: IFeatureSource[], maxZoom: number): LolOpenLayersVectorLayerDef => {
  return {
    name: Layer.DIAGRAMS,
    type: LayerType.VECTOR,
    visible: true,
    inInitialZoom: true,
    declutterLabels: true,
    togglable: false,
    zIndex: zIndexes[Layer.DIAGRAMS],
    style: diagramStyles,
    source: {
      type: SourceType.FEATURES,
      data,
      maxZoom,
    } as LolOpenLayersFeatureSourceDef,
  } as LolOpenLayersVectorLayerDef;
};

export const diagramsQueryLayer = (transactionId: number, maxZoom: number): LolOpenLayersVectorLayerDef => {
  return {
    name: Layer.DIAGRAMS,
    type: LayerType.VECTOR,
    visible: true,
    inInitialZoom: true,
    declutterLabels: true,
    togglable: false,
    zIndex: zIndexes[Layer.DIAGRAMS],
    style: diagramStyles,
    source: {
      type: SourceType.FEATURES,
      queryKey: getDiagramsQueryKey(transactionId),
      queryFun: async () =>
        getDiagramsForOpenLayers(await new DiagramsControllerApi(apiConfig()).diagrams({ transactionId })),
      maxZoom,
    } as LolOpenLayersFeatureSourceDef,
  } as LolOpenLayersVectorLayerDef;
};

export const selectDiagramsLayer = (transactionId: number, maxZoom: number): LolOpenLayersVectorLayerDef => {
  return {
    name: Layer.SELECT_DIAGRAMS,
    type: LayerType.VECTOR,
    visible: false,
    inInitialZoom: false,
    declutterLabels: true,
    togglable: false,
    zIndex: zIndexes[Layer.SELECT_DIAGRAMS],
    style: userDiagramStylesSelectable,
    highlightStyle: diagramStylesSelected,
    geometrySizeForClickDetection: 1,
    source: {
      type: SourceType.FEATURES,
      queryKey: getDiagramsQueryKey(transactionId),
      queryFun: async () =>
        getDiagramsForOpenLayers(await new DiagramsControllerApi(apiConfig()).diagrams({ transactionId })),
      maxZoom,
    } as LolOpenLayersFeatureSourceDef,
  } as LolOpenLayersVectorLayerDef;
};

export const linesLayer = (transactionId: number, maxZoom: number): LolOpenLayersVectorLayerDef => {
  return {
    name: Layer.LINES,
    type: LayerType.VECTOR,
    visible: true,
    inInitialZoom: true,
    declutterLabels: true,
    togglable: false,
    zIndex: zIndexes[Layer.LINES],
    style: lineStyles,
    source: {
      type: SourceType.FEATURES,
      queryKey: getLinesQueryKey(transactionId),
      queryFun: () => getLinesQuery(transactionId),
      maxZoom,
    } as LolOpenLayersFeatureSourceDef,
  } as LolOpenLayersVectorLayerDef;
};

export const selectLinesLayer = (transactionId: number, maxZoom: number): LolOpenLayersVectorLayerDef => {
  return {
    name: Layer.SELECT_LINES,
    type: LayerType.VECTOR,
    visible: false,
    inInitialZoom: true,
    declutterLabels: true,
    togglable: false,
    zIndex: zIndexes[Layer.SELECT_LINES],
    style: ctlineSelectableStyles,
    highlightStyle: lineStyle_selected,
    source: {
      type: SourceType.FEATURES,
      queryKey: getLinesQueryKey(transactionId),
      queryFun: () => getLinesQuery(transactionId),
      maxZoom,
    } as LolOpenLayersFeatureSourceDef,
    geometrySizeForClickDetection: 20,
  } as LolOpenLayersVectorLayerDef;
};

export const extinguishedLinesLayer = (transactionId: number, maxZoom: number): LolOpenLayersVectorLayerDef => {
  return {
    name: Layer.EXTINGUISHED_LINES,
    type: LayerType.VECTOR,
    visible: false,
    inInitialZoom: false,
    declutterLabels: true,
    togglable: false,
    zIndex: zIndexes[Layer.EXTINGUISHED_LINES],
    style: lineStyle_selectable,
    highlightStyle: lineStyle_selected,
    source: {
      type: SourceType.FEATURES,
      queryKey: getExtinguishedLinesQueryKey(transactionId),
      queryFun: () => getExtinguishedLinesQuery(transactionId),
      maxZoom,
    } as LolOpenLayersFeatureSourceDef,
    geometrySizeForClickDetection: 20,
  } as LolOpenLayersVectorLayerDef;
};

export const labelsLayer = (transactionId: number, maxZoom: number): LolOpenLayersVectorLayerDef => {
  return {
    name: Layer.LABELS,
    type: LayerType.VECTOR,
    visible: true,
    inInitialZoom: true,
    declutterLabels: true,
    togglable: false,
    zIndex: zIndexes[Layer.LABELS],
    style: labelStyles,
    source: {
      type: SourceType.FEATURES,
      queryKey: getLabelsQueryKey(transactionId),
      queryFun: async () =>
        getLabelsForOpenLayers(await new DiagramLabelsControllerApi(apiConfig()).getLabels({ transactionId })),
      maxZoom,
    } as LolOpenLayersFeatureSourceDef,
  } as LolOpenLayersVectorLayerDef;
};

export const underlyingParcelsLayer = (maxZoom: number): LolOpenLayersVectorLayerDef => {
  const { apiGatewayBaseUrl } = window._env_;
  return {
    name: Layer.UNDERLYING_PARCELS,
    type: LayerType.VECTOR_TILE,
    visible: true,
    maxResolution: 10,
    style: underlyingParcelStyles,
    source: {
      type: SourceType.MVT,
      url: `${apiGatewayBaseUrl}/v1/generate-plans/tiles/${Layer.UNDERLYING_PARCELS}/{z}/{x}/{-y}`,
      maxZoom: maxZoom > 30 ? 30 : maxZoom, // maximum Level for Tile Matrix Set of EPSG:900913
    } as LolOpenLayersMVTSourceDef,
  } as LolOpenLayersVectorTileLayerDef;
};

export const underlyingRoadCentreLine = (maxZoom: number): LolOpenLayersVectorLayerDef => {
  const { apiGatewayBaseUrl } = window._env_;
  return {
    name: Layer.UNDERLYING_ROAD_CENTER_LINE,
    type: LayerType.VECTOR_TILE,
    visible: true,
    maxResolution: 10,
    style: vtRoadsCentrelineStyleFunction,
    source: {
      type: SourceType.MVT,
      url: `${apiGatewayBaseUrl}/v1/generate-plans/tiles/${Layer.UNDERLYING_ROAD_CENTER_LINE}/{z}/{x}/{-y}`,
      maxZoom: maxZoom > 30 ? 30 : maxZoom, // maximum Level for Tile Matrix Set of EPSG:900913
    } as LolOpenLayersMVTSourceDef,
  } as LolOpenLayersVectorTileLayerDef;
};
