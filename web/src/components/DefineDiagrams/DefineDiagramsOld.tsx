import "./DefineDiagrams.scss";

import { LolOpenLayersMap, LolOpenLayersMapContextProvider } from "@linzjs/landonline-openlayers-map";
import { LuiLoadingSpinner } from "@linzjs/lui";
import { useLuiModalPrefab } from "@linzjs/windows";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";
import { ReactNode, useEffect } from "react";
import { generatePath, useNavigate } from "react-router-dom";

import {
  diagramsLayer,
  linzMLBasemapLayer,
  marksLayer,
  parcelsLayer,
  underlyingParcelsLayer,
  vectorsLayer,
} from "@/components/DefineDiagrams/MapLayers";
import Header from "@/components/Header/Header";
import { errorFromSerializedError, unhandledErrorModal } from "@/components/modals/unhandledErrorModal";
import { useTransactionId } from "@/hooks/useTransactionId";
import { Paths } from "@/Paths";
import { useGetDiagramsQuery } from "@/queries/diagrams";
import { PrepareDatasetError, usePrepareDatasetMutation } from "@/queries/prepareDataset";
import { useSurveyFeaturesQuery } from "@/queries/surveyFeatures";

import {
  getDiagramsForOpenLayers_OLD,
  getMarksForOpenLayers,
  getParcelsForOpenLayers,
  getVectorsForOpenLayers,
} from "./featureMapper";
import { prepareDatasetErrorModal } from "./prepareDatasetErrorModal";

export interface DefineDiagramsProps {
  mock?: boolean;
  children?: ReactNode;
}

// adding projection definitions to allow conversions between them
// EPSG:1 is what the data from the DB comes in as
// EPSG:3857 is used as the openlayers map projection
proj4.defs("EPSG:1", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs +pm=160");
register(proj4);

export const DefineDiagrams = ({ mock, children }: DefineDiagramsProps) => {
  const maxZoom = 24;
  const transactionId = useTransactionId();
  const navigate = useNavigate();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

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
    data: diagrams,
    isLoading: diagramsIsLoading,
    error: diagramsError,
  } = useGetDiagramsQuery({
    transactionId,
    enabled: prepareDatasetIsSuccess, // Don't fetch diagrams until the dataset is prepared
  });

  const error = prepareDatasetError ?? featuresError ?? diagramsError;
  const isLoading = !prepareDatasetIsSuccess || featuresIsLoading || diagramsIsLoading;

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
    void showPrefabModal(
      error instanceof PrepareDatasetError ? prepareDatasetErrorModal(error) : unhandledErrorModal(serializedError),
    ).then(() => navigate(generatePath(Paths.root, { transactionId })));
  }, [error, navigate, showPrefabModal, transactionId]);

  return (
    <LolOpenLayersMapContextProvider>
      <Header view="Diagrams" />
      <div className="DefineDiagrams" ref={modalOwnerRef}>
        {isLoading && <LuiLoadingSpinner />}
        {!isLoading && features && diagrams && (
          <LolOpenLayersMap
            view={{
              projection: "EPSG:3857",
              center: [19457143.791, -5057154.019],
              zoom: 16,
              maxZoom,
            }}
            bufferFactor={1.2}
            mock={mock}
            layers={[
              linzMLBasemapLayer(maxZoom),
              underlyingParcelsLayer(maxZoom),
              parcelsLayer(getParcelsForOpenLayers(features), maxZoom),
              marksLayer(getMarksForOpenLayers(features), maxZoom),
              vectorsLayer(getVectorsForOpenLayers(features), maxZoom),
              diagramsLayer(getDiagramsForOpenLayers_OLD(diagrams), maxZoom),
            ]}
          />
        )}
        {children}
      </div>
    </LolOpenLayersMapContextProvider>
  );
};
