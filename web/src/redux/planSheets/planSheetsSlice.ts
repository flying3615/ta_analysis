import { DiagramDTO, PageDTO } from "@linz/survey-plan-generation-api-client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";

export interface PlanSheetsState {
  diagrams: DiagramDTO[];
  pages: PageDTO[];
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
    setPlanData: (state, action: PayloadAction<{ diagrams: DiagramDTO[]; pages: PageDTO[] }>) => {
      state.diagrams = action.payload.diagrams;
      state.pages = action.payload.pages;
      state.hasChanges = false;
      const sheetTypes = [PlanSheetType.TITLE, PlanSheetType.SURVEY];
      sheetTypes.forEach((type) => {
        if (state.pages.some((page) => page.pageType === type) && !state.activePageNumbers[type]) {
          state.activePageNumbers[type] = 1;
        }
      });
    },
    replaceDiagrams: (state, action: PayloadAction<DiagramDTO[]>) => {
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
    setDiagramPageRef: (state, action: PayloadAction<{ id: number; pageRef: number | undefined }>) => {
      const { id, pageRef } = action.payload;
      state.diagrams = state.diagrams.map((d) => (d.id === id ? { ...d, pageRef } : d));
      state.hasChanges = true;
    },
    removeDiagramPageRef: (state, action: PayloadAction<number>) => {
      state.diagrams.forEach((diagram) => {
        if (diagram.pageRef === action.payload) {
          diagram.pageRef = undefined;
        }
      });
    },
    updatePages: (state, action: PayloadAction<PageDTO[]>) => {
      state.pages = action.payload;
      state.hasChanges = true;
    },
  },
  selectors: {
    getPlanData: (state) => ({ diagrams: state.diagrams, pages: state.pages }),
    getDiagrams: (state) => state.diagrams,
    getPages: (state) => state.pages,
    getActiveSheet: (state) => state.activeSheet,
    getPageNumberFromPageRef: (state) => (pageID: number) => {
      const page = state.pages.find((page) => page.pageType === state.activeSheet && page.id === pageID);
      return page?.pageNumber ?? null;
    },
    getActivePageRefFromPageNumber: (state) => {
      const page = state.pages.find(
        (page) => page.pageType === state.activeSheet && page.pageNumber === state.activePageNumbers[state.activeSheet],
      );
      return page?.id ?? null;
    },
    getPageRefFromPageNumber: (state) => (pageNumber: number) => {
      const page = state.pages.find((page) => page.pageType === state.activeSheet && page.pageNumber === pageNumber);
      return page?.id ?? null;
    },
    getActiveDiagrams: (state) => {
      // Return diagrams on active page
      const activePageNumber = state.activePageNumbers[state.activeSheet];
      const activePage = state.pages.find(
        (page) => page.pageType === state.activeSheet && page.pageNumber === activePageNumber,
      );
      return state.diagrams.filter((diagram) => diagram.pageRef === activePage?.id);
    },
    getActivePages: (state) => {
      return state.pages.filter((page) => state.activeSheet === page.pageType);
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

export const {
  setPlanData,
  replaceDiagrams,
  setActiveSheet,
  setActivePageNumber,
  removeDiagramPageRef,
  setDiagramPageRef,
  updatePages,
} = planSheetsSlice.actions;

export const {
  getPlanData,
  getDiagrams,
  getPages,
  getActivePages,
  getActiveSheet,
  getPageNumberFromPageRef,
  getPageRefFromPageNumber,
  getActivePageRefFromPageNumber,
  getActiveDiagrams,
  getActivePageNumber,
  getFilteredPages,
  hasChanges,
} = planSheetsSlice.selectors;

export default planSheetsSlice;
