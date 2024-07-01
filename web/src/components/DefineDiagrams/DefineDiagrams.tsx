import "./DefineDiagrams.scss";

import { LolOpenLayersMap, LolOpenLayersMapContextProvider } from "@linzjs/landonline-openlayers-map";
import {
  diagramsLayer,
  linzMLBasemapLayer,
  marksLayer,
  parcelsLayer,
  underlyingParcelsLayer,
  vectorsLayer,
} from "@/components/DefineDiagrams/MapLayers.ts";
import { ReactNode, useEffect } from "react";
import Header from "@/components/Header/Header";
import { generatePath, useNavigate } from "react-router-dom";
import {
  fetchFeatures,
  getError,
  getMarksForOpenlayers,
  getParcelsForOpenlayers,
  getVectorsForOpenLayers,
  isFulfilled,
} from "@/redux/survey-features/surveyFeaturesSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { LuiLoadingSpinner } from "@linzjs/lui";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { useLuiModalPrefab } from "@linzjs/windows";
import { errorFromSerializedError, unhandledErrorModal } from "@/components/modals/unhandledErrorModal.tsx";
import {
  fetchDiagrams,
  getDiagramsError,
  getDiagramsForOpenlayers,
  isDiagramsFulfilled,
} from "@/redux/diagrams/diagramsSlice.ts";
import { PrepareDatasetError, usePrepareDatasetMutation } from "@/queries/prepareDataset";
import { prepareDatasetErrorModal } from "./prepareDatasetErrorModal";
import { Paths } from "@/Paths";
import { useTransactionId } from "@/hooks/useTransactionId";

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
  const dispatch = useAppDispatch();
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

  const {
    mutate: prepareDataset,
    error: prepareDatasetError,
    isSuccess: prepareDatasetIsSuccess,
  } = usePrepareDatasetMutation(transactionId);

  useEffect(() => {
    // Call prepareDataset only once, when initially mounting
    prepareDataset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const marks = useAppSelector((state) => getMarksForOpenlayers(state));
  const parcels = useAppSelector((state) => getParcelsForOpenlayers(state));
  const vectors = useAppSelector((state) => getVectorsForOpenLayers(state));
  const diagrams = useAppSelector((state) => {
    return getDiagramsForOpenlayers(state);
  });

  useEffect(() => {
    if (prepareDatasetIsSuccess) {
      dispatch(fetchFeatures(transactionId));
      dispatch(fetchDiagrams(transactionId));
    }
  }, [transactionId, prepareDatasetIsSuccess, dispatch]);

  const featuresFulfilled = useAppSelector((state) => isFulfilled(state));
  const diagramsFulfilled = useAppSelector((state) => isDiagramsFulfilled(state));
  const featuresError = useAppSelector((state) => getError(state));
  const diagramsError = useAppSelector((state) => getDiagramsError(state));
  const error = prepareDatasetError ?? featuresError ?? diagramsError;
  const hasLoaded = prepareDatasetIsSuccess && featuresFulfilled && diagramsFulfilled;

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

  return (
    <LolOpenLayersMapContextProvider>
      <Header view="Diagrams" />
      <div className="DefineDiagrams" ref={modalOwnerRef}>
        {!hasLoaded && <LuiLoadingSpinner />}
        {hasLoaded && (
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
              parcelsLayer(parcels, maxZoom),
              marksLayer(marks, maxZoom),
              vectorsLayer(vectors, maxZoom),
              diagramsLayer(diagrams, maxZoom),
            ]}
          />
        )}
        {children}
      </div>
    </LolOpenLayersMapContextProvider>
  );
};
