import {
  IInflightParcels,
  IMarks,
  IObservation,
  ResponseError,
  SurveyFeaturesControllerApi,
  SurveyFeaturesResponseDTO,
} from "@linz/survey-plan-generation-api-client";
import { SerializedError, createSelector } from "@reduxjs/toolkit";
import { planGenApiConfig } from "@/redux/apiConfig";
import { IFeatureSource } from "@linzjs/landonline-openlayers-map";
import { createAppSlice } from "@/redux/createAppSlice";

export interface SurveyFeaturesState {
  isFetching: boolean;
  isFulfilled: boolean;
  marks: IMarks[];
  primaryParcels: IInflightParcels[];
  nonPrimaryParcels: IInflightParcels[];
  centreLineParcels: IInflightParcels[];
  parcelDimensionVectors: IObservation[];
  nonBoundaryVectors: IObservation[];
  error?: SerializedError;
}

const initialState: SurveyFeaturesState = {
  isFetching: false,
  isFulfilled: false,
  marks: [],
  primaryParcels: [],
  nonPrimaryParcels: [],
  centreLineParcels: [],
  parcelDimensionVectors: [],
  nonBoundaryVectors: [],
  error: undefined,
};

export const surveyFeaturesSlice = createAppSlice({
  name: "surveyFeatures",
  initialState,
  reducers: (create) => ({
    fetchFeatures: create.asyncThunk(
      async (transactionId: number, { rejectWithValue }) => {
        try {
          const client: SurveyFeaturesControllerApi = new SurveyFeaturesControllerApi(planGenApiConfig());
          const response: SurveyFeaturesResponseDTO = await client.getSurveyFeatures({ transactionId });
          return response;
        } catch (err) {
          const errResponse = err as ResponseError;
          const errResponseJson = await errResponse.response.json();

          return rejectWithValue({
            name: errResponse.response.statusText,
            message: errResponseJson?.message ?? errResponse.message,
            code: errResponse.response.status,
          });
        }
      },
      {
        pending: (state) => {
          state.isFetching = true;
        },
        fulfilled: (state, action) => {
          const {
            marks,
            primaryParcels,
            nonPrimaryParcels,
            centreLineParcels,
            parcelDimensionVectors,
            nonBoundaryVectors,
          } = action.payload;

          state.isFetching = false;
          state.isFulfilled = true;
          state.marks = marks;
          state.primaryParcels = primaryParcels;
          state.nonPrimaryParcels = nonPrimaryParcels;
          state.centreLineParcels = centreLineParcels;
          state.parcelDimensionVectors = parcelDimensionVectors ?? [];
          state.nonBoundaryVectors = nonBoundaryVectors ?? [];
        },
        rejected: (state, action) => {
          state.isFetching = false;
          state.error = action.payload as SerializedError;
        },
      },
    ),
  }),
  selectors: {
    isFetching: (state) => state.isFetching,
    isFulfilled: (state) => state.isFulfilled,
    getError: (state) => state.error,

    getMarksForOpenlayers: createSelector(
      (state: SurveyFeaturesState) => state.marks,
      (marks) =>
        marks.map(
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
        ),
    ),
    getVectorsForOpenLayers: createSelector(
      [
        (state: SurveyFeaturesState) => state.parcelDimensionVectors,
        (state: SurveyFeaturesState) => state.nonBoundaryVectors,
      ],
      (parcelDimension, nonBoundary: IObservation[]) => {
        return [...parcelDimension, ...nonBoundary].map(
          (o) =>
            ({
              id: o.id,
              transactionId: o.transactionId,
              surveyClass: o.properties.surveyClass,
              isParcelDimensionVector: o.properties.primary === "Y" || o.properties.nonPrimary === "Y",
              isNonBoundaryVector: o.properties.traverse === "Y",
              shape: {
                geometry: o.geometry,
              },
            }) as IFeatureSource,
        );
      },
    ),

    getParcelsForOpenlayers: createSelector(
      [
        (state: SurveyFeaturesState) => state.primaryParcels,
        (state: SurveyFeaturesState) => state.nonPrimaryParcels,
        (state: SurveyFeaturesState) => state.centreLineParcels,
      ],
      (primary, nonPrimary, centreline) =>
        [...primary, ...nonPrimary, ...centreline].map(
          (p) =>
            ({
              id: p.id,
              parcelIntent: p.properties.intentCode.code,
              topoClass: p.properties.topologyClass,
              shape: {
                geometry: p.geometry,
              },
            }) as IFeatureSource,
        ),
    ),
  },
});

export const { fetchFeatures } = surveyFeaturesSlice.actions;
export const {
  isFetching,
  isFulfilled,
  getError,
  getMarksForOpenlayers,
  getParcelsForOpenlayers,
  getVectorsForOpenLayers,
} = surveyFeaturesSlice.selectors;
