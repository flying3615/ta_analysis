import { IDiagram, IPage } from "@linz/survey-plan-generation-api-client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";

export interface PlanSheetsState {
  diagrams: IDiagram[];
  pages: IPage[];
  activeSheet: PlanSheetType;
  activePageNumbers: { [key in PlanSheetType]: number };
  hasChanges: boolean;
}

const initialState: PlanSheetsState = {
  diagrams: [],
  pages: [],
  activeSheet: PlanSheetType.TITLE,
  activePageNumbers: {
    [PlanSheetType.TITLE]: 0,
    [PlanSheetType.SURVEY]: 0,
  },
  hasChanges: false,
};

const planSheetsSlice = createSlice({
  name: "planSheets",
  initialState,
  reducers: {
    setPlanData: (state, action: PayloadAction<{ diagrams: IDiagram[]; pages: IPage[] }>) => {
      state.diagrams = action.payload.diagrams;
      state.pages = action.payload.pages;
      state.hasChanges = false;

      const sheetTypes = [PlanSheetType.TITLE, PlanSheetType.SURVEY];
      sheetTypes.forEach((type) => {
        if (state.pages.some((page) => page.pageType === type)) {
          state.activePageNumbers[type] = 1;
        }
      });
    },
    replaceDiagrams: (state, action: PayloadAction<IDiagram[]>) => {
      action.payload.forEach((diagram) => {
        const index = state.diagrams.findIndex((d) => d.id === diagram.id);
        state.diagrams[index] = diagram;
      });
      state.hasChanges = true;
    },
    setActiveSheet: (state, action: PayloadAction<PlanSheetType>) => {
      state.activeSheet = action.payload;
    },
    setActivePageNumber: (state, action: PayloadAction<{ pageType: PlanSheetType; pageNumber: number }>) => {
      state.activePageNumbers[action.payload.pageType] = action.payload.pageNumber;
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
    getActivePageNumber: (state) => {
      const pageType = state.activeSheet;
      return state.activePageNumbers[pageType];
    },
    getFilteredPages: (state) => {
      const filteredPages = state.pages.filter((page) => page.pageType === state.activeSheet);
      return {
        totalPages: filteredPages.length,
      };
    },
    hasChanges: (state) => state.hasChanges,
  },
});

export const { setPlanData, replaceDiagrams, setActiveSheet, setActivePageNumber } = planSheetsSlice.actions;

export const {
  getPlanData,
  getDiagrams,
  getPages,
  getActiveSheet,
  getActiveDiagrams,
  getActivePageNumber,
  getFilteredPages,
  hasChanges,
} = planSheetsSlice.selectors;

export default planSheetsSlice;
