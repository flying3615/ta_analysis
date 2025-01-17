import { CpgDiagramType } from "@linz/luck-syscodes/build/js/CpgDiagramType";
import type { DiagramsResponseDTODiagramsInner } from "@linz/survey-plan-generation-api-client";
import {
  DiagramsResponseDTO,
  ExtinguishedLinesResponseDTO,
  LabelsResponseDTO,
  LinesResponseDTO,
  SurveyFeaturesResponseDTO,
} from "@linz/survey-plan-generation-api-client";
import { LinesResponseDTOLinesInnerSymbolTypeEnum } from "@linz/survey-plan-generation-api-client";
import { IFeatureSource } from "@linzjs/landonline-openlayers-map";
import { sortBy } from "lodash-es";

//Think of this like a zindex (1 bottom, 6 top)
const diagramTypeSortOrder = {
  [CpgDiagramType.UDFT]: 1,
  [CpgDiagramType.UDFN]: 2,
  [CpgDiagramType.UDFP]: 3,
  [CpgDiagramType.SYST]: 4,
  [CpgDiagramType.SYSN]: 5,
  [CpgDiagramType.SYSP]: 6,
};

export const sortByDiagramsByType = (a: IFeatureSourceDiagram) => diagramTypeSortOrder[a.diagramType as CpgDiagramType];

export const sortLabelsByType = (a: IFeatureSourceLabel, b: IFeatureSourceLabel) => {
  return diagramTypeSortOrder[a.type as CpgDiagramType] - diagramTypeSortOrder[b.type as CpgDiagramType];
};

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
    topoClass: p.properties.topologyClass?.code,
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

export type IFeatureSourceDiagram = IFeatureSource & { diagramType: string };

export const getDiagramsForOpenLayers = ({ diagrams }: DiagramsResponseDTO): IFeatureSourceDiagram[] =>
  sortBy(diagrams.map(MapDiagramToOpenLayers), sortByDiagramsByType);

export const getDiagramsForOpenLayers_OLD = ({ diagrams }: DiagramsResponseDTO): IFeatureSource[] =>
  diagrams.map((d) => ({
    id: d.id,
    diagramType: d.diagramType,
    shape: {
      geometry: d.shape,
    },
  }));

export const MapDiagramToOpenLayers = (diagramId: DiagramsResponseDTODiagramsInner): IFeatureSourceDiagram => ({
  id: diagramId.id,
  diagramType: diagramId.diagramType,
  shape: {
    geometry: diagramId.shape,
  },
});

export type IFeatureSourceLine = IFeatureSource & { symbolType: LinesResponseDTOLinesInnerSymbolTypeEnum };

export const getLinesForOpenLayers = ({ lines }: LinesResponseDTO): IFeatureSourceLine[] =>
  lines.map((d) => ({
    id: d.id,
    symbolType: d.symbolType,
    shape: {
      geometry: d.shape,
    },
  }));

export const getExtinguishedLinesForOpenLayers = ({ lines }: ExtinguishedLinesResponseDTO): IFeatureSource[] =>
  lines.map((d) => ({
    id: d.id,
    parcelId: d.parcelId,
    shape: {
      geometry: d.shape,
    },
  }));

export type IFeatureSourceLabel = IFeatureSource & { type: string };

export const getLabelsForOpenLayers = ({ labels }: LabelsResponseDTO): IFeatureSourceLabel[] =>
  labels
    .map((d) => ({
      id: d.id,
      name: d.name,
      shape: {
        geometry: d.shape,
      },
      type: d.diagramType,
    }))
    .sort(sortLabelsByType);
