import { IDiagram, IPage } from "@linz/survey-plan-generation-api-client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";

export interface PlanSheetsState {
  diagrams: IDiagram[];
  pages: IPage[];
  activeSheet: PlanSheetType;
}

const initialState: PlanSheetsState = {
  diagrams: [],
  pages: [],
  activeSheet: PlanSheetType.TITLE,
};

const planSheetsSlice = createSlice({
  name: "planSheets",
  initialState,
  reducers: {
    setPlanData: (state, action: PayloadAction<{ diagrams: IDiagram[]; pages: IPage[] }>) => {
      state.diagrams = action.payload.diagrams;
      state.pages = action.payload.pages;
    },
    replaceDiagrams: (state, action: PayloadAction<IDiagram[]>) => {
      action.payload.forEach((diagram) => {
        const index = state.diagrams.findIndex((d) => d.id === diagram.id);
        state.diagrams[index] = diagram;
      });
    },
    setActiveSheet: (state, action: PayloadAction<PlanSheetType>) => {
      state.activeSheet = action.payload;
    },
  },
  selectors: {
    getPlanData: (state) => ({ diagrams: state.diagrams, pages: state.pages }),
    getDiagrams: (state) => state.diagrams,
    getPages: (state) => state.pages,
    getActiveSheet: (state) => state.activeSheet,
    getActiveDiagrams: (state) => {
      const SheetToDiagramMap: Record<PlanSheetType, string> = {
        [PlanSheetType.SURVEY]: "sysGenTraverseDiag",
        [PlanSheetType.TITLE]: "sysGenPrimaryDiag",
      };
      const activeDiagramType = SheetToDiagramMap[state.activeSheet];
      return state.diagrams.filter((diagram) => diagram.diagramType === activeDiagramType);
    },
  },
});

export const { setPlanData, replaceDiagrams, setActiveSheet } = planSheetsSlice.actions;

export const { getPlanData, getDiagrams, getPages, getActiveSheet, getActiveDiagrams } = planSheetsSlice.selectors;

export default planSheetsSlice;
