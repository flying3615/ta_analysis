import "./DefineDiagrams.scss";

import { LabelsResponseDTO } from "@linz/survey-plan-generation-api-client";
import {
  LolOpenLayersMap,
  LolOpenLayersMapContext,
  LolOpenLayersMapContextProvider,
} from "@linzjs/landonline-openlayers-map";
import { LuiLoadingSpinner } from "@linzjs/lui";
import { useLuiModalPrefab } from "@linzjs/windows";
import { useQueryClient } from "@tanstack/react-query";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";
import { PropsWithChildren, useContext, useEffect, useMemo } from "react";
import { generatePath, useNavigate } from "react-router-dom";

import { DefineDiagram } from "@/components/DefineDiagrams/DefineDiagram";
import { EnlargeDiagram } from "@/components/DefineDiagrams/EnlargeDiagram";
import {
  getLabelsForOpenLayers,
  getLinesForOpenLayers,
  getMarksForOpenLayers,
  getParcelsForOpenLayers,
  getVectorsForOpenLayers,
} from "@/components/DefineDiagrams/featureMapper";
import {
  diagramsQueryLayer,
  labelsLayer,
  linesLayer,
  marksLayer,
  parcelsLayer,
  underlyingParcelsLayer,
  underlyingRoadCentreLine,
  vectorsLayer,
} from "@/components/DefineDiagrams/MapLayers.ts";
import Header from "@/components/Header/Header";
import { errorFromSerializedError, unhandledErrorModal } from "@/components/modals/unhandledErrorModal";
import { useTransactionId } from "@/hooks/useTransactionId";
import { Paths } from "@/Paths";
import { useGetLabelsQuery } from "@/queries/labels";
import { useGetLinesQuery } from "@/queries/lines";
import { PrepareDatasetError, usePrepareDatasetMutation } from "@/queries/prepareDataset";
import { useSurveyFeaturesQuery } from "@/queries/surveyFeatures";

import { DefineDiagramMenuButtons } from "./DefineDiagramHeaderButtons";
import { prepareDatasetErrorModal } from "./prepareDatasetErrorModal";

export interface DefineDiagramsProps {
  mock?: boolean;
}

// adding projection definitions to allow conversions between them
// EPSG:1 is what the data from the DB comes in as
// EPSG:3857 is used as the openlayers map projection
proj4.defs("EPSG:1", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs +pm=160");
register(proj4);

const maxZoom = 24;

export const DefineDiagrams = (props: PropsWithChildren<DefineDiagramsProps>) => {
  return (
    <LolOpenLayersMapContextProvider>
      <DefineDiagramsInner {...props} />
    </LolOpenLayersMapContextProvider>
  );
};

export const DefineDiagramsInner = ({ mock, children }: PropsWithChildren<DefineDiagramsProps>) => {
  const queryClient = useQueryClient();
  const transactionId = useTransactionId();
  const navigate = useNavigate();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();
  const mapContext = useContext(LolOpenLayersMapContext);
  /* eslint-disable */
  (window as any)["map"] = mapContext.map;

  const {
    mutate: prepareDataset,
    isSuccess: prepareDatasetIsSuccess,
    error: prepareDatasetError,
  } = usePrepareDatasetMutation({ transactionId });

  const {
    data: features,
    isLoading: featuresIsLoading,
    error: featuresError,
  } = useSurveyFeaturesQuery({
    transactionId,
    enabled: prepareDatasetIsSuccess, // Don't fetch features until the dataset is prepared
  });

  const {
    data: diagramLines,
    isLoading: diagramLinesIsLoading,
    error: diagramLinesError,
  } = useGetLinesQuery({
    transactionId,
    enabled: prepareDatasetIsSuccess, // Don't fetch lines until the dataset is prepared
  });

  const {
    data: diagramLabels,
    isLoading: diagramLabelsIsLoading,
    error: diagramLabelsError,
  } = useGetLabelsQuery({
    transactionId,
    enabled: prepareDatasetIsSuccess, // Don't fetch labels until the dataset is prepared
  });

  const error = prepareDatasetError ?? featuresError ?? diagramLabelsError ?? diagramLinesError ?? diagramLabelsError;
  const isLoading = !prepareDatasetIsSuccess || featuresIsLoading || diagramLinesIsLoading || diagramLabelsIsLoading;

  useEffect(() => {
    // Call prepareDataset only once, when initially mounting
    prepareDataset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!error) {
      return;
    }
    const serializedError = error instanceof PrepareDatasetError ? error : errorFromSerializedError(error);
    newrelic.noticeError(serializedError);
    showPrefabModal(
      error instanceof PrepareDatasetError ? prepareDatasetErrorModal(error) : unhandledErrorModal(serializedError),
    ).then(() => navigate(generatePath(Paths.root, { transactionId })));
  }, [error, navigate, showPrefabModal, transactionId]);

  const layers = useMemo(
    () =>
      prepareDatasetIsSuccess &&
      features &&
      diagramLines &&
      diagramLabels && [
        underlyingParcelsLayer(maxZoom),
        underlyingRoadCentreLine(maxZoom),
        parcelsLayer(getParcelsForOpenLayers(features), maxZoom),
        marksLayer(getMarksForOpenLayers(features), maxZoom),
        vectorsLayer(getVectorsForOpenLayers(features), maxZoom),
        diagramsQueryLayer(transactionId, maxZoom),
        linesLayer(getLinesForOpenLayers(diagramLines), maxZoom),
        labelsLayer(getLabelsForOpenLayers(diagramLabels as LabelsResponseDTO), maxZoom),
      ],
    [diagramLabels, diagramLines, features, prepareDatasetIsSuccess, transactionId],
  );

  return (
    <>
      <Header view="Diagrams">
        <DefineDiagramMenuButtons />
      </Header>
      <div className="DefineDiagrams" ref={modalOwnerRef}>
        {isLoading && <LuiLoadingSpinner />}
        {layers && (
          <LolOpenLayersMap
            queryClient={queryClient}
            view={{
              projection: "EPSG:3857",
              center: [19457143.791, -5057154.019],
              zoom: 16,
              maxZoom,
            }}
            bufferFactor={1.2}
            mock={mock}
            layers={layers}
          />
        )}
        {children}
      </div>
      <DefineDiagram />
      <EnlargeDiagram />
    </>
  );
};
