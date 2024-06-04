import { IDiagram, IPage, PlanControllerApi, ResponseError } from "@linz/survey-plan-generation-api-client";
import { createSelector, SerializedError } from "@reduxjs/toolkit";
import { planGenApiConfig } from "@/redux/apiConfig";
import { createAppSlice } from "@/redux/createAppSlice";

import { extractEdges, extractNodes } from "@/modules/plan/extractGraphData.ts";
import { IEdgeData, INodeData } from "@/components/CytoscapeCanvas/cytoscapeDefinitionsFromData.ts";

export interface PlanState {
  isPlanFetching: boolean;
  diagrams: IDiagram[];
  pages: IPage[];
  nodeData: INodeData[];
  edgeData: IEdgeData[];
  error?: SerializedError;
}

const initialState: PlanState = {
  isPlanFetching: false,
  diagrams: [],
  pages: [],
  nodeData: [],
  edgeData: [],
  error: undefined,
};

export const planSlice = createAppSlice({
  name: "plan",
  initialState,
  reducers: (create) => ({
    fetchPlan: create.asyncThunk(
      async (transactionId: number, { rejectWithValue }) => {
        try {
          const client = new PlanControllerApi(planGenApiConfig());
          return await client.plan({ transactionId });
        } catch (err) {
          const errResponse = err as ResponseError;
          const errResponseJson = await (err as ResponseError).response.json();

          return rejectWithValue({
            name: errResponse.response.statusText,
            message: errResponseJson?.message ?? errResponse.message,
            code: errResponse.response.status,
          });
        }
      },
      {
        pending: (state) => {
          state.isPlanFetching = true;
        },
        fulfilled: (state, action) => {
          const { diagrams, pages } = action.payload;

          state.isPlanFetching = false;
          state.error = undefined;
          state.diagrams = diagrams;
          state.pages = pages;

          state.nodeData = extractNodes(state.diagrams);
          state.edgeData = extractEdges(state.diagrams);
        },
        rejected: (state, action) => {
          state.isPlanFetching = false;
          state.error = action.payload as SerializedError;
        },
      },
    ),
  }),
  selectors: {
    isPlanFetching: (state) => state.isPlanFetching,
    getPlanError: (state) => state.error,
    // Here we filter the first diagram, a future story will filter by page
    getNodeDataForPage: createSelector(
      [(state: PlanState) => state.nodeData, (_state: PlanState, pageNumber: number) => pageNumber],
      (nodeData, _pageNumber) => nodeData.filter((node) => node.diagramIndex === 0),
    ),
    getEdgeDataForPage: createSelector(
      [(state: PlanState) => state.edgeData, (_state: PlanState, pageNumber: number) => pageNumber],
      (edgeData, _pageNumber) => edgeData.filter((edge) => edge.diagramIndex == 0),
    ),
    getDiagrams: (state) => state.diagrams,
  },
});

export const { fetchPlan } = planSlice.actions;
export const { isPlanFetching, getPlanError, getNodeDataForPage, getEdgeDataForPage, getDiagrams } =
  planSlice.selectors;
