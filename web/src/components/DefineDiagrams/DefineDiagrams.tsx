import "./DefineDiagrams.scss";

import { LolOpenLayersMap, LolOpenLayersMapContextProvider } from "@linzjs/landonline-openlayers-map";
import { linzMLBasemapLayer, marksLayer } from "@/components/DefineDiagrams/MapLayers.ts";
import { ReactNode, useEffect } from "react";
import Header from "@/components/Header/Header";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchFeatures,
  getError,
  getMarksForOpenlayers,
  isFetching,
} from "@/redux/survey-features/surveyFeaturesSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { LuiLoadingSpinner } from "@linzjs/lui";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";

interface DefineDiagramsProps {
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
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const featuresFetching = useAppSelector((state) => isFetching(state));
  const error = useAppSelector((state) => getError(state));
  const marks = useAppSelector((state) => getMarksForOpenlayers(state));

  useEffect(() => {
    transactionId && dispatch(fetchFeatures(parseInt(transactionId)));
  }, [dispatch, transactionId]);

  return (
    <LolOpenLayersMapContextProvider>
      <Header onNavigate={navigate} transactionId={transactionId} view="Diagrams" />
      <div className="DefineDiagrams">
        {featuresFetching && <LuiLoadingSpinner />}
        {error && <p>Sorry, there was an error</p>}
        {!featuresFetching && !error && (
          <LolOpenLayersMap
            view={{
              projection: "EPSG:3857",
              center: [19457143.791, -5057154.019],
              zoom: 16,
              maxZoom,
            }}
            bufferFactor={1.2}
            mock={mock}
            layers={[linzMLBasemapLayer(maxZoom), marksLayer(marks, maxZoom)]}
          />
        )}
        {children}
      </div>
    </LolOpenLayersMapContextProvider>
  );
};
