import {
  IInflightParcels,
  IMarks,
  ResponseError,
  SurveyFeaturesControllerApi,
} from "@linz/survey-plan-generation-api-client";
import { SerializedError, createSelector } from "@reduxjs/toolkit";
import { planGenApiConfig } from "@/redux/apiConfig";
import { IFeatureSource } from "@linzjs/landonline-openlayers-map";
import { createAppSlice } from "@/redux/createAppSlice";

export interface SurveyFeaturesState {
  isFetching: boolean;
  marks: IMarks[];
  primaryParcels: IInflightParcels[];
  nonPrimaryParcels: IInflightParcels[];
  centreLineParcels: IInflightParcels[];
  error?: SerializedError;
}

const initialState: SurveyFeaturesState = {
  isFetching: false,
  marks: [],
  primaryParcels: [],
  nonPrimaryParcels: [],
  centreLineParcels: [],
  error: undefined,
};

export const surveyFeaturesSlice = createAppSlice({
  name: "surveyFeatures",
  initialState,
  reducers: (create) => ({
    fetchFeatures: create.asyncThunk(
      async (transactionId: number, { rejectWithValue }) => {
        try {
          const client = new SurveyFeaturesControllerApi(planGenApiConfig());
          const res = await client.getSurveyFeatures({ transactionId });
          return res;
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
          const { marks, primaryParcels, nonPrimaryParcels, centreLineParcels } = action.payload;

          state.isFetching = false;
          state.marks = marks;
          state.primaryParcels = primaryParcels;
          state.nonPrimaryParcels = nonPrimaryParcels;
          state.centreLineParcels = centreLineParcels;
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
export const { isFetching, getError, getMarksForOpenlayers, getParcelsForOpenlayers } = surveyFeaturesSlice.selectors;
