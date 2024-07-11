import {
  DiagramsResponseDTO,
  LinesResponseDTO,
  SurveyFeaturesResponseDTO,
} from "@linz/survey-plan-generation-api-client";
import { IFeatureSource } from "@linzjs/landonline-openlayers-map";

export const getMarksForOpenLayers = (features: SurveyFeaturesResponseDTO): IFeatureSource[] =>
  features.marks.map(
    (m) =>
      ({
        id: m.id,
        name: m.properties.name,
        label: m.properties.name,
        markSymbol: m.properties.symbolCode,
        shape: {
          geometry: m.geometry,
        },
      }) as IFeatureSource,
  );

export const getParcelsForOpenLayers = (features: SurveyFeaturesResponseDTO): IFeatureSource[] =>
  [...features.primaryParcels, ...features.nonPrimaryParcels, ...features.centreLineParcels].map((p) => ({
    id: p.id,
    parcelIntent: p.properties.intentCode.code,
    topoClass: p.properties.topologyClass,
    shape: {
      geometry: p.geometry,
    },
  }));

export const getVectorsForOpenLayers = (features: SurveyFeaturesResponseDTO): IFeatureSource[] =>
  [...(features.parcelDimensionVectors ?? []), ...(features.nonBoundaryVectors ?? [])].map((o) => ({
    id: o.id,
    transactionId: o.transactionId,
    surveyClass: o.properties.surveyClass,
    isParcelDimensionVector: o.properties.primary === "Y" || o.properties.nonPrimary === "Y",
    isNonBoundaryVector: o.properties.traverse === "Y",
    shape: {
      geometry: o.geometry,
    },
  }));

export const getDiagramsForOpenLayers = ({ diagrams }: DiagramsResponseDTO): IFeatureSource[] =>
  diagrams.map((d) => ({
    id: d.id,
    diagramType: d.diagramType,
    shape: {
      geometry: d.shape,
    },
  }));

export const getLinesForOpenLayers = ({ lines }: LinesResponseDTO): IFeatureSource[] =>
  lines.map((d) => ({
    id: d.id,
    symbolType: d.symbolType,
    shape: {
      geometry: d.shape,
    },
  }));
