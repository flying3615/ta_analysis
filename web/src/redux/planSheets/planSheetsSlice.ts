import { ConfigDataDTO, DiagramDTO, DisplayStateEnum, PageDTO } from "@linz/survey-plan-generation-api-client";
import { LabelDTO } from "@linz/survey-plan-generation-api-client/src/models/LabelDTO";
import { LineDTO } from "@linz/survey-plan-generation-api-client/src/models/LineDTO";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { cloneDeep } from "lodash-es";

import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { CoordLookup, LookupOriginalCoord } from "@/modules/plan/LookupOriginalCoord";
import { PreviousDiagramAttributes } from "@/modules/plan/PreviousDiagramAttributes";

export interface PlanSheetsState {
  configs?: ConfigDataDTO[];
  diagrams: DiagramDTO[];
  pages: PageDTO[];
  activeSheet: PlanSheetType;
  activePageNumbers: { [key in PlanSheetType]: number };
  hasChanges: boolean;
  planMode: PlanMode;
  lastUpdatedLineStyle?: string;
  alignedLabelNodeId?: string;
  diagramIdToMove?: number | undefined;
  previousDiagramAttributesMap: Record<number, PreviousDiagramAttributes>;
  copiedElements?: { elements: LabelDTO[] | LineDTO[]; action: "COPY" | "CUT" };
  // undo buffer
  previousHasChanges?: boolean;
  previousDiagrams: DiagramDTO[] | null;
  previousPages: PageDTO[] | null;
  originalPositions?: CoordLookup;
  canViewHiddenLabels: boolean;
  navigateAfterSave?: string;
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
  originalPositions: {},
  canViewHiddenLabels: true,
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
      state.originalPositions = LookupOriginalCoord(action.payload.diagrams);
    },
    replaceDiagrams: (state, action: PayloadAction<DiagramDTO[]>) => {
      onDataChanging(state);
      action.payload.forEach((diagram) => {
        const index = state.diagrams.findIndex((d) => d.id === diagram.id);
        state.diagrams[index] = diagram;
      });
    },
    replacePage: (state, action: PayloadAction<{ updatedPage: PageDTO; applyOnDataChanging?: boolean }>) => {
      const { updatedPage, applyOnDataChanging } = action.payload;
      (applyOnDataChanging ?? true) && onDataChanging(state);
      const index = state.pages.findIndex((page) => page.id === updatedPage.id);
      state.pages[index] = updatedPage;
    },
    setActiveSheet: (state, action: PayloadAction<PlanSheetType>) => {
      state.activeSheet = action.payload;
    },
    setActivePageNumber: (state, action: PayloadAction<{ pageType: PlanSheetType; pageNumber: number }>) => {
      state.activePageNumbers[action.payload.pageType] = action.payload.pageNumber;
    },
    setDiagramPageRef: (
      state,
      action: PayloadAction<{ id: number; pageRef: number | undefined; adjustDiagram: (d: DiagramDTO) => DiagramDTO }>,
    ) => {
      onDataChanging(state);
      const { id, pageRef, adjustDiagram } = action.payload;
      state.diagrams = state.diagrams.map((d) => (d.id === id ? { ...adjustDiagram(d), pageRef } : d));
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
    setLastUpdatedLineStyle: (state, action: PayloadAction<string>) => {
      state.lastUpdatedLineStyle = action.payload;
    },
    setAlignedLabelNodeId: (state, action: PayloadAction<{ nodeId: string }>) => {
      state.alignedLabelNodeId = action.payload.nodeId;
    },
    setDiagramIdToMove: (state, action: PayloadAction<number | undefined>) => {
      state.diagramIdToMove = action.payload;
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
    setCopiedElements: (state, action: PayloadAction<{ ids: number[]; type: string; action: "COPY" | "CUT" }>) => {
      const { ids, type } = action.payload;
      if (ids.length === 0) return;

      if (type === "label") {
        const targetLabels: LabelDTO[] = [];
        state.pages.forEach((page) => {
          const copiedLabels = page.labels?.filter((label) => ids.includes(label.id));
          if (copiedLabels && copiedLabels.length > 0 && copiedLabels[0] !== undefined) {
            targetLabels.push(...copiedLabels);
          }
        });
        state.copiedElements = {
          elements: targetLabels,
          action: action.payload.action,
        };
      } else {
        const targetLines: LineDTO[] = [];
        state.pages.forEach((page) => {
          const copiedLines = page.lines?.filter((line) => ids.includes(line.id));
          if (copiedLines && copiedLines.length > 0 && copiedLines[0] !== undefined) {
            targetLines.push(copiedLines[0]);
          }
        });
        state.copiedElements = {
          elements: targetLines,
          action: action.payload.action,
        };
      }
    },
    removePageLines: (state, action: PayloadAction<{ lineIds: string[] }>) => {
      const { lineIds } = action.payload;

      onDataChanging(state);

      state.pages.forEach((page) => {
        const linesToRemove = page.lines?.filter((line) => lineIds.includes(line.id.toString())) ?? [];
        page.lines = page.lines?.filter((line) => !linesToRemove.includes(line));

        //also remove any page coordinates from the removed lines that are not referenced by any other lines
        const coordinatesToRemove = linesToRemove
          .flatMap((line) => line.coordRefs)
          .filter((coordRef) => !page.lines?.some((line) => line.coordRefs.includes(coordRef)));
        page.coordinates = page.coordinates?.filter((coord) => !coordinatesToRemove.includes(coord.id));
      });
    },
    removePageLabels: (state, action: PayloadAction<{ labelIds: number[] }>) => {
      const { labelIds } = action.payload;

      onDataChanging(state);

      state.pages.forEach((page) => {
        page.labels = page.labels?.filter((label) => !labelIds.includes(label.id));
      });
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
    setCanViewHiddenLabels: (state, action: PayloadAction<boolean>) => {
      state.canViewHiddenLabels = action.payload;
    },
    navigateAfterSave: (state, action: PayloadAction<string | undefined>) => {
      state.navigateAfterSave = action.payload;
    },
  },
  selectors: {
    getPlanData: (state) => ({ diagrams: state.diagrams, pages: state.pages }),
    getDiagrams: (state) => state.diagrams,
    getPages: (state) => state.pages,
    getActiveSheet: (state) => state.activeSheet,
    getPageConfigs: (state) => state.configs?.[0]?.pageConfigs ?? [],
    getElementTypeConfigs: (state) => state.configs?.[0]?.elementTypeConfigs ?? [],
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

      let activePage = state.pages.find(
        (page) => state.activeSheet === page.pageType && page.pageNumber === activePageNumber,
      );

      // if the copied elements are cut, remove them from the active page
      if (state.copiedElements && state.copiedElements.action === "CUT") {
        if (activePage) {
          const updatedLabels = activePage.labels?.filter(
            (label) => !state.copiedElements?.elements.some((el) => el.id === label.id),
          );
          activePage = { ...activePage, labels: updatedLabels };

          const updatedLines = activePage.lines?.filter(
            (line) => !state.copiedElements?.elements.some((el) => el.id === line.id),
          );
          activePage = { ...activePage, lines: updatedLines };
        }
      }

      return activePage;
    },
    getActivePageNumber: (state) => {
      const pageType = state.activeSheet;
      return state.activePageNumbers[pageType];
    },
    getCopiedElements: (state) => state.copiedElements,
    getFilteredPages: (state) => {
      const filteredPages = state.pages.filter((page) => page.pageType === state.activeSheet);
      return {
        totalPages: filteredPages.length,
      };
    },
    getOriginalPositions: (state) => state.originalPositions,
    hasChanges: (state) => state.hasChanges,
    getPlanMode: (state) => state.planMode,
    getLastUpdatedLineStyle: (state) => state.lastUpdatedLineStyle,
    getAlignedLabelNodeId: (state) => state.alignedLabelNodeId,
    getDiagramIdToMove: (state) => state.diagramIdToMove,
    getPreviousAttributesForDiagram:
      (state) =>
      (id: number): PreviousDiagramAttributes | undefined => {
        return state.previousDiagramAttributesMap[id];
      },
    canUndo: (state) => state.previousDiagrams != null && state.previousPages != null,
    getCanViewHiddenLabels: (state) => state.canViewHiddenLabels,
    hasNavigateAfterSave: (state) => state.navigateAfterSave,
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
  setLastUpdatedLineStyle,
  setAlignedLabelNodeId,
  setDiagramIdToMove,
  setSymbolHide,
  setCopiedElements,
  setPreviousDiagramAttributes,
  setLineHide,
  removePageLines,
  removePageLabels,
  undo,
  clearUndo,
  setCanViewHiddenLabels,
  navigateAfterSave,
} = planSheetsSlice.actions;

export const {
  getPlanData,
  getDiagrams,
  getPages,
  getActivePages,
  getActivePage,
  getActiveSheet,
  getPageConfigs,
  getElementTypeConfigs,
  getPageNumberFromPageRef,
  getPageRefFromPageNumber,
  getActivePageRefFromPageNumber,
  getActivePageNumber,
  getFilteredPages,
  getOriginalPositions,
  hasChanges,
  getPlanMode,
  getLastUpdatedLineStyle,
  getCopiedElements,
  getAlignedLabelNodeId,
  getDiagramIdToMove,
  getPreviousAttributesForDiagram,
  canUndo,
  getCanViewHiddenLabels,
  hasNavigateAfterSave,
} = planSheetsSlice.selectors;

export default planSheetsSlice;
