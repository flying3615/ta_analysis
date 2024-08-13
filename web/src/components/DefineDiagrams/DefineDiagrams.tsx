import "./DefineDiagrams.scss";
import "@/components/MainWindow.scss";

import {
  LolOpenLayersMap,
  LolOpenLayersMapContext,
  LolOpenLayersMapContextProvider,
} from "@linzjs/landonline-openlayers-map";
import { LuiLoadingSpinner } from "@linzjs/lui";
import { useLuiModalPrefab } from "@linzjs/windows";
import { useQueryClient } from "@tanstack/react-query";
import { sortBy } from "lodash-es";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";
import { PropsWithChildren, useContext, useEffect, useMemo } from "react";
import { generatePath, useNavigate } from "react-router-dom";

import { EnlargeDiagram } from "@/components/DefineDiagrams/EnlargeDiagram";
import {
  getMarksForOpenLayers,
  getParcelsForOpenLayers,
  getVectorsForOpenLayers,
} from "@/components/DefineDiagrams/featureMapper";
import {
  diagramsQueryLayer,
  extinguishedLinesLayer,
  labelsLayer,
  linesLayer,
  marksLayer,
  parcelsLayer,
  selectLinesLayer,
  underlyingParcelsLayer,
  underlyingRoadCentreLine,
  vectorsLayer,
} from "@/components/DefineDiagrams/MapLayers.ts";
import { useInsertDiagramHook } from "@/components/DefineDiagrams/useInsertDiagramHook";
import Header from "@/components/Header/Header";
import { errorFromSerializedError, unhandledErrorModal } from "@/components/modals/unhandledErrorModal";
import PlanKey from "@/components/PlanKey/PlanKey";
import { useHasChanged } from "@/hooks/useHasChanged.ts";
import { useTransactionId } from "@/hooks/useTransactionId";
import { Paths } from "@/Paths";
import { useGetLinesQuery } from "@/queries/lines";
import { PrepareDatasetError, usePrepareDatasetQuery } from "@/queries/prepareDataset";
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
  const mapContext = useContext(LolOpenLayersMapContext);
  const { showPrefabModal } = useLuiModalPrefab();

  useInsertDiagramHook();

  const { isSuccess: prepareDatasetIsSuccess, error: prepareDatasetError } = usePrepareDatasetQuery({ transactionId });

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

  const error = prepareDatasetError ?? featuresError ?? diagramLinesError;
  const isLoading = !prepareDatasetIsSuccess || featuresIsLoading || diagramLinesIsLoading;

  /* eslint-disable-next-line */
  (window as any).map = mapContext.map;
  const anyLoading = !error && (isLoading || mapContext.loading);
  const loadingHasChanged = useHasChanged(anyLoading);
  if (loadingHasChanged) {
    // Set a global value last time loading changed to false
    /* eslint-disable-next-line */
    (window as any).lastLoadingTimestamp = anyLoading ? undefined : Date.now();
  }

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
      diagramLines && [
        underlyingParcelsLayer(maxZoom),
        underlyingRoadCentreLine(maxZoom),
        parcelsLayer(getParcelsForOpenLayers(features), maxZoom),
        marksLayer(getMarksForOpenLayers(features), maxZoom),
        vectorsLayer(getVectorsForOpenLayers(features), maxZoom),
        diagramsQueryLayer(transactionId, maxZoom),
        linesLayer(transactionId, maxZoom),
        labelsLayer(transactionId, maxZoom),
        extinguishedLinesLayer(transactionId, maxZoom),
        selectLinesLayer(transactionId, maxZoom),
      ],
    [diagramLines, features, prepareDatasetIsSuccess, transactionId],
  );

  return (
    <div className="MainWindow">
      <Header view="Diagrams">
        <DefineDiagramMenuButtons />
      </Header>
      <div className="DefineDiagrams">
        {isLoading && <LuiLoadingSpinner />}
        {layers && (
          <>
            <PlanKey transactionId={transactionId} />
            <LolOpenLayersMap
              queryClient={queryClient}
              view={{
                projection: "EPSG:3857",
                center: [19457143.791, -5057154.019],
                zoom: 16,
                maxZoom,
              }}
              sortFeaturesBySelectionPriority={(features) => sortBy(features, (f) => -f.layer.getZIndex())}
              bufferFactor={1.2}
              mock={mock}
              layers={layers}
            />
          </>
        )}
        {children}
      </div>
      <EnlargeDiagram />
    </div>
  );
};
