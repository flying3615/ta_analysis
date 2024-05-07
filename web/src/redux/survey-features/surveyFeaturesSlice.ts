import { IMarks, SurveyFeaturesControllerApi } from "@linz/survey-plan-generation-api-client";
import { Reducer, SerializedError, createSelector } from "@reduxjs/toolkit";
import { planGenApiConfig } from "../apiConfig";
import { IFeatureSource } from "@linzjs/landonline-openlayers-map";
import { createAppSlice } from "../createAppSlice";

export interface SurveyFeaturesState {
  isFetching: boolean;
  marks: IMarks[];
  error?: SerializedError;
}

const initialState: SurveyFeaturesState = {
  isFetching: false,
  marks: [],
  error: undefined,
};

export const surveyFeaturesSlice = createAppSlice({
  name: "surveyFeatures",
  initialState,
  reducers: (create) => ({
    fetchFeatures: create.asyncThunk(
      async (transactionId: number) => {
        const client = new SurveyFeaturesControllerApi(planGenApiConfig());
        const res = await client.getSurveyFeatures({ transactionId });
        return res;
      },
      {
        pending: (state) => {
          state.isFetching = true;
        },
        fulfilled: (state, action) => {
          const { marks } = action.payload;

          state.isFetching = false;
          state.marks = marks;
        },
        rejected: (state, action) => {
          state.isFetching = false;
          state.error = action.error;
        },
      },
    ),
  }),
  selectors: {
    isFetching: (state) => state.isFetching,
    getError: (state) => state.error,
    getMarksForOpenlayers: createSelector(
      (state) => state.marks,
      (marks: IMarks[]) =>
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
  },
});

export const { fetchFeatures } = surveyFeaturesSlice.actions;
export const { isFetching, getError, getMarksForOpenlayers } = surveyFeaturesSlice.selectors;

export default surveyFeaturesSlice.reducer as Reducer<SurveyFeaturesState>;
