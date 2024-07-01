import { DiagramsControllerApi, ResponseError } from "@linz/survey-plan-generation-api-client";
import { createSelector, SerializedError } from "@reduxjs/toolkit";
import { planGenApiConfig } from "@/redux/apiConfig";
import { IFeatureSource } from "@linzjs/landonline-openlayers-map";
import { createAppSlice } from "@/redux/createAppSlice";
import { DiagramsResponseDTODiagramsInner } from "@linz/survey-plan-generation-api-client/src/models/DiagramsResponseDTODiagramsInner.ts";

export interface DiagramsState {
  isFetching: boolean;
  isFulfilled: boolean;
  diagrams: DiagramsResponseDTODiagramsInner[];
  error?: SerializedError;
}

const initialState: DiagramsState = {
  isFetching: false,
  isFulfilled: false,
  diagrams: [],
  error: undefined,
};

export const diagramsSlice = createAppSlice({
  name: "diagrams",
  initialState,
  reducers: (create) => ({
    fetchDiagrams: create.asyncThunk(
      async (transactionId: number, { rejectWithValue }) => {
        try {
          const client: DiagramsControllerApi = new DiagramsControllerApi(planGenApiConfig());
          return await client.diagrams({ transactionId });
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
          const { diagrams } = action.payload;

          state.isFetching = false;
          state.isFulfilled = true;
          state.diagrams = diagrams;
        },
        rejected: (state, action) => {
          state.isFetching = false;
          state.error = action.payload as SerializedError;
        },
      },
    ),
  }),
  selectors: {
    isDiagramsFetching: (state) => state.isFetching,
    isDiagramsFulfilled: (state) => state.isFulfilled,
    getDiagramsError: (state) => state.error,

    getDiagramsForOpenlayers: createSelector(
      (state: DiagramsState) => state.diagrams,
      (diagrams) =>
        diagrams.map(
          (m) =>
            ({
              id: m.id,
              diagramType: m.diagramType,
              shape: {
                geometry: m.shape,
              },
            }) as IFeatureSource,
        ),
    ),
  },
});

export const { fetchDiagrams } = diagramsSlice.actions;
export const { isDiagramsFetching, isDiagramsFulfilled, getDiagramsError, getDiagramsForOpenlayers } =
  diagramsSlice.selectors;
