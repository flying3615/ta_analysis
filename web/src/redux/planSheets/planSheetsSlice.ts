import { ConfigDataDTO, DiagramDTO, DisplayStateEnum, PageDTO } from "@linz/survey-plan-generation-api-client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { cloneDeep } from "lodash-es";

import { DiagramToMovePayload } from "@/components/PlanSheets/interactions/MoveDiagramToPageModal.tsx";
import { PlanPropertyPayload } from "@/components/PlanSheets/PlanElementProperty.tsx";
import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { PreviousDiagramAttributes } from "@/modules/plan/PreviousDiagramAttributes.ts";

export interface PlanSheetsState {
  configs?: ConfigDataDTO[];
  diagrams: DiagramDTO[];
  pages: PageDTO[];
  activeSheet: PlanSheetType;
  activePageNumbers: { [key in PlanSheetType]: number };
  hasChanges: boolean;
  planMode: PlanMode;
  planProperty?: PlanPropertyPayload | undefined;
  diagramToMove?: DiagramToMovePayload | undefined;
  previousDiagramAttributesMap: Record<string, PreviousDiagramAttributes>;
  // undo buffer
  previousHasChanges?: boolean;
  previousDiagrams: DiagramDTO[] | null;
  previousPages: PageDTO[] | null;
}

const initialState: PlanSheetsState = {
  configs: [],
  diagrams: [],
  pages: [],
  activeSheet: PlanSheetType.TITLE,
  activePageNumbers: {
    [PlanSheetType.TITLE]: 0,
    [PlanSheetType.SURVEY]: 0,
  },
  hasChanges: false,
  planMode: PlanMode.View,
  previousDiagramAttributesMap: {},
  previousDiagrams: null,
  previousPages: null,
};

/**
 * Call this *before* any action changes diagrams or pages
 * Include here anything we want to update based on the old
 * state
 *
 * NOTE: in React dev mode, the Redux actions can be called twice.
 * You need to determine based on state if you are making
 * the substantive change - see `setLineHide` etc.
 */
const onDataChanging = (state: PlanSheetsState) => {
  state.previousHasChanges = state.hasChanges;
  state.previousDiagrams = cloneDeep(state.diagrams);
  state.previousPages = cloneDeep(state.pages);
  state.hasChanges = true;
};

const planSheetsSlice = createSlice({
  name: "planSheets",
  initialState,
  reducers: {
    setPlanData: (
      state,
      action: PayloadAction<{ configs?: ConfigDataDTO[]; diagrams: DiagramDTO[]; pages: PageDTO[] }>,
    ) => {
      state.configs = action.payload.configs;
      state.diagrams = action.payload.diagrams;
      state.pages = action.payload.pages;
      state.hasChanges = false;
      state.previousDiagrams = null;
      state.previousPages = null;

      const sheetTypes = [PlanSheetType.TITLE, PlanSheetType.SURVEY];
      sheetTypes.forEach((type) => {
        if (state.pages.some((page) => page.pageType === type) && !state.activePageNumbers[type]) {
          state.activePageNumbers[type] = 1;
        }
      });
    },
    replaceDiagrams: (state, action: PayloadAction<DiagramDTO[]>) => {
      onDataChanging(state);
      action.payload.forEach((diagram) => {
        const index = state.diagrams.findIndex((d) => d.id === diagram.id);
        state.diagrams[index] = diagram;
      });
    },
    replacePage: (state, action: PayloadAction<PageDTO>) => {
      onDataChanging(state);
      const index = state.pages.findIndex((page) => page.id === action.payload.id);
      state.pages[index] = action.payload;
    },
    setActiveSheet: (state, action: PayloadAction<PlanSheetType>) => {
      state.activeSheet = action.payload;
    },
    setActivePageNumber: (state, action: PayloadAction<{ pageType: PlanSheetType; pageNumber: number }>) => {
      state.activePageNumbers[action.payload.pageType] = action.payload.pageNumber;
    },
    setDiagramPageRef: (state, action: PayloadAction<{ id: number; pageRef: number | undefined }>) => {
      onDataChanging(state);
      const { id, pageRef } = action.payload;
      state.diagrams = state.diagrams.map((d) => (d.id === id ? { ...d, pageRef } : d));
    },
    removeDiagramPageRef: (state, action: PayloadAction<number>) => {
      onDataChanging(state);
      state.diagrams.forEach((diagram) => {
        if (diagram.pageRef === action.payload) {
          diagram.pageRef = undefined;
        }
      });
    },
    updatePages: (state, action: PayloadAction<PageDTO[]>) => {
      onDataChanging(state);
      state.pages = action.payload;
    },
    setPlanMode: (state, action: PayloadAction<PlanMode>) => {
      state.planMode = action.payload;
    },
    setPlanProperty: (state, action: PayloadAction<PlanPropertyPayload | undefined>) => {
      state.planProperty = action.payload;
    },
    setDiagramToMove: (state, action: PayloadAction<DiagramToMovePayload | undefined>) => {
      state.diagramToMove = action.payload;
    },
    setSymbolHide: (state, action: PayloadAction<{ id: string; hide: boolean }>) => {
      const { id, hide } = action.payload;

      const labelToChange = state.diagrams.flatMap((diagram) => {
        return diagram.coordinateLabels.filter((label) => label.id.toString() === id);
      })[0];
      if (!labelToChange) return;
      const labelIsHidden = ["hide", "systemHide"].includes(labelToChange.displayState ?? "");
      if (labelIsHidden === hide) return;

      onDataChanging(state);

      labelToChange.displayState = hide ? DisplayStateEnum.hide : DisplayStateEnum.display;
    },
    setPreviousDiagramAttributes: (state, action: PayloadAction<PreviousDiagramAttributes>) => {
      state.previousDiagramAttributesMap[action.payload.id] = action.payload;
    },
    setLineHide: (state, action: PayloadAction<{ id: string; hide: boolean }>) => {
      const { id, hide } = action.payload;

      const lineToChange = state.diagrams.flatMap((diagram) => {
        return diagram.lines.filter((line) => {
          return line.id.toString() === id;
        });
      })[0];

      if (!lineToChange) return;
      const lineIsHidden = ["hide", "systemHide"].includes(lineToChange.displayState ?? "");
      if (lineIsHidden === hide) return;

      onDataChanging(state);

      lineToChange.displayState = hide ? DisplayStateEnum.hide : DisplayStateEnum.display;
    },
    undo: (state) => {
      if (!state.previousDiagrams || !state.previousPages) return;

      state.hasChanges = state.previousHasChanges ?? false;

      state.diagrams = cloneDeep(state.previousDiagrams);
      state.pages = cloneDeep(state.previousPages);

      state.previousDiagrams = null;
      state.previousPages = null;
    },
    clearUndo: (state) => {
      state.previousHasChanges = false;
      state.previousDiagrams = null;
      state.previousPages = null;
    },
  },
  selectors: {
    getPlanData: (state) => ({ diagrams: state.diagrams, pages: state.pages }),
    getDiagrams: (state) => state.diagrams,
    getPages: (state) => state.pages,
    getActiveSheet: (state) => state.activeSheet,
    getPageConfigs: (state) => state.configs?.[0]?.pageConfigs ?? [],
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
    getActivePages: (state) => {
      return state.pages.filter((page) => state.activeSheet === page.pageType);
    },
    getActivePage: (state) => {
      const activePageNumber = state.activePageNumbers[state.activeSheet];
      return state.pages.find((page) => state.activeSheet === page.pageType && page.pageNumber === activePageNumber);
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
    getPlanMode: (state) => state.planMode,
    getPlanProperty: (state) => state.planProperty,
    getDiagramToMove: (state) => state.diagramToMove,
    getPreviousAttributesForDiagram:
      (state) =>
      (id: string): PreviousDiagramAttributes | undefined => {
        return state.previousDiagramAttributesMap[id];
      },
    canUndo: (state) => state.previousDiagrams != null && state.previousPages != null,
  },
});

export const {
  setPlanData,
  replaceDiagrams,
  replacePage,
  setActiveSheet,
  setActivePageNumber,
  removeDiagramPageRef,
  setDiagramPageRef,
  updatePages,
  setPlanMode,
  setPlanProperty,
  setDiagramToMove,
  setSymbolHide,
  setPreviousDiagramAttributes,
  setLineHide,
  undo,
  clearUndo,
} = planSheetsSlice.actions;

export const {
  getPlanData,
  getDiagrams,
  getPages,
  getActivePages,
  getActivePage,
  getActiveSheet,
  getPageConfigs,
  getPageNumberFromPageRef,
  getPageRefFromPageNumber,
  getActivePageRefFromPageNumber,
  getActivePageNumber,
  getFilteredPages,
  hasChanges,
  getPlanMode,
  getPlanProperty,
  getDiagramToMove,
  getPreviousAttributesForDiagram,
  canUndo,
} = planSheetsSlice.selectors;

export default planSheetsSlice;
