import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { DefineDiagramsActionType } from "@/components/DefineDiagrams/defineDiagramsType";

export interface DefineDiagramsState {
  action: DefineDiagramsActionType;
}

const initialState: DefineDiagramsState = {
  action: "idle",
};

const defineDiagramsSlice = createSlice({
  name: "defineDiagrams",
  initialState,
  reducers: {
    setActiveAction: (state, action: PayloadAction<DefineDiagramsActionType>) => {
      state.action = action.payload;
    },
  },
  selectors: {
    getActiveAction: (state) => state.action,
  },
});

export const { setActiveAction } = defineDiagramsSlice.actions;

export const { getActiveAction } = defineDiagramsSlice.selectors;

export default defineDiagramsSlice;
