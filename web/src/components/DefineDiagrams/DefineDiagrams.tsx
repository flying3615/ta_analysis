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
import MapBrowserEvent from "ol/MapBrowserEvent";
import { PropsWithChildren, useContext, useEffect, useMemo } from "react";
import { generatePath, useNavigate } from "react-router-dom";

import { CommonButtons } from "@/components/CommonButtons.tsx";
import {
  getMarksForOpenLayers,
  getParcelsForOpenLayers,
  getVectorsForOpenLayers,
} from "@/components/DefineDiagrams/featureMapper";
import {
  diagramLabelsLayer,
  diagramsQueryLayer,
  extinguishedLinesLayer,
  linesLayer,
  marksLayer,
  parcelsLayer,
  selectDiagramsLayer,
  selectLinesLayer,
  underlyingParcelsLayer,
  underlyingRoadCentreLine,
  vectorsLayer,
} from "@/components/DefineDiagrams/MapLayers.ts";
import Header from "@/components/Header/Header";
import { errorFromSerializedError, unhandledErrorModal } from "@/components/modals/unhandledErrorModal";
import PlanKey from "@/components/PlanKey/PlanKey";
import { useHasChanged } from "@/hooks/useHasChanged.ts";
import { useTransactionId } from "@/hooks/useTransactionId";
import { Paths } from "@/Paths";
import { useGetLinesQuery } from "@/queries/lines";
import { PrepareDatasetError, usePrepareDatasetQuery } from "@/queries/prepareDataset";
import { useSurveyFeaturesQuery } from "@/queries/surveyFeatures";
import { metersToLatLongCoordinate } from "@/util/mapUtil.ts";

import { DefineDiagramMenuButtons } from "./DefineDiagramHeaderButtons";
import { prepareDatasetErrorModal } from "./prepareDatasetErrorModal";

export interface DefineDiagramsProps {
  mock?: boolean;
}

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
  const { map, loading: mapLoading } = useContext(LolOpenLayersMapContext);
  const { showPrefabModal } = useLuiModalPrefab();

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
  (window as any).map = map;
  const anyLoading = !error && (isLoading || mapLoading);
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
        diagramLabelsLayer(transactionId, maxZoom),
        extinguishedLinesLayer(transactionId, maxZoom),
        selectLinesLayer(transactionId, maxZoom),
        selectDiagramsLayer(transactionId, maxZoom),
      ],
    [diagramLines, features, prepareDatasetIsSuccess, transactionId],
  );

  // Leave this to help testers
  useEffect(() => {
    const logClick = (e: MapBrowserEvent<MouseEvent>) => {
      console.log(`Map click`, {
        pixel: e.pixel,
        meters: e.coordinate,
        coordinate: metersToLatLongCoordinate(e.coordinate),
      });
    };

    map?.on("click", logClick);
    return () => {
      map?.un("click", logClick);
    };
  }, [map]);

  return (
    <div className="MainWindow">
      <Header view="Diagrams">
        <DefineDiagramMenuButtons />
        <CommonButtons />
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
    </div>
  );
};
