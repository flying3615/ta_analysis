import {
  ConfigDataDTO,
  DiagramDTO,
  DisplayStateEnum,
  PageDTO,
  PlanResponseDTO,
} from "@linz/survey-plan-generation-api-client";
import { LabelDTO } from "@linz/survey-plan-generation-api-client/src/models/LabelDTO";
import { LineDTO } from "@linz/survey-plan-generation-api-client/src/models/LineDTO";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { cloneDeep } from "lodash-es";

import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { defaultOptionalVisibileLabelTypes } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { CoordLookup, LookupOriginalCoord } from "@/modules/plan/LookupOriginalCoord";
import { PreviousDiagramAttributes } from "@/modules/plan/PreviousDiagramAttributes";
import { revertAll } from "@/redux/revertAll";

export interface PlanSheetsState {
  // plan data
  configs?: ConfigDataDTO[];
  diagrams: DiagramDTO[];
  lastModifiedAt?: string;
  pages: PageDTO[];
  // auto recovery
  lastChangedAt?: string;
  // UI state
  activeSheet: PlanSheetType;
  activePageNumbers: { [key in PlanSheetType]: number };
  hasChanges: boolean;
  planMode: PlanMode;
  lastUpdatedLineStyle?: string;
  lastUpdatedLabelStyle?: { font?: string; fontSize?: number };
  alignedLabelNodeId?: string;
  diagramIdToMove?: number | undefined;
  previousDiagramAttributesMap: Record<number, PreviousDiagramAttributes>;
  copiedElements?: {
    elements: LabelDTO[] | LineDTO[];
    action: "COPY" | "CUT" | "PASTE";
    type: "label" | "line";
    pageId?: number;
  };
  // undo buffer
  previousHasChanges?: boolean;
  previousDiagrams: DiagramDTO[] | null;
  previousPages: PageDTO[] | null;
  originalPositions?: CoordLookup;
  canViewHiddenLabels: boolean;
  navigateAfterSave?: string;
  viewableLabelTypes: string[];
  selectedElementIds?: string[];
}

export interface UserEdit extends PlanResponseDTO {
  lastChangedAt?: string;
}

const IS_HIDDEN_OBJECTS_VISIBLE_STORAGE_KEY = "plangen.isHiddenObjectsVisibleByDefault";

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
  canViewHiddenLabels: localStorage.getItem(IS_HIDDEN_OBJECTS_VISIBLE_STORAGE_KEY) !== "false",
  viewableLabelTypes: defaultOptionalVisibileLabelTypes,
  selectedElementIds: [],
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
  // for auto-recovery to detect when data changed
  state.lastChangedAt = new Date().toISOString();
};

// type based on T with K keys made optional
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

const planSheetsSlice = createSlice({
  name: "planSheets",
  initialState,
  extraReducers: (builder) => builder.addCase(revertAll, () => initialState),
  reducers: {
    setPlanData: (state, action: PayloadAction<Optional<PlanResponseDTO, "configs">>) => {
      state.configs = action.payload.configs;
      state.diagrams = action.payload.diagrams;
      state.lastModifiedAt = action.payload.lastModifiedAt;
      state.pages = action.payload.pages;
      state.hasChanges = false;
      state.lastChangedAt = undefined;
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
    recoverAutoSave: (state, action: PayloadAction<UserEdit>) => {
      // set data as usual
      planSheetsSlice.caseReducers.setPlanData(state, action);
      // but mark as changed
      state.hasChanges = true;
      state.lastChangedAt = action.payload.lastChangedAt;
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
    doPastePageLabels: (state, action: PayloadAction<{ updatedPage: PageDTO }>) => {
      const { updatedPage } = action.payload;
      onDataChanging(state);
      const targetPageIndex = state.pages.findIndex((page) => page.id === updatedPage.id);

      if (!state.copiedElements) return;

      if (state.copiedElements.action === "CUT") {
        // do copy action
        state.pages[targetPageIndex] = updatedPage;

        // then remove the original label from the source page
        const originalPageId = state.copiedElements.pageId;
        const originalPage = state.pages.find((page) => page.id === originalPageId)!;
        const originalPageIndex = state.pages.findIndex((page) => page.id === originalPageId);
        const originalLabels = originalPage?.labels?.filter(
          (label) => !state.copiedElements?.elements.some((el) => el.id === label.id),
        );
        state.pages[originalPageIndex] = { ...originalPage, labels: originalLabels };
      } else {
        // If it's a copy action, just update the page with the new labels
        state.pages[targetPageIndex] = updatedPage;
      }
      state.copiedElements.action = "PASTE";
    },
    doPastePageLines: (state, action: PayloadAction<{ updatedPage: PageDTO }>) => {
      const { updatedPage } = action.payload;
      onDataChanging(state);

      if (!state.copiedElements) return;

      const targetPageIndex = state.pages.findIndex((page) => page.id === updatedPage.id);
      if (state.copiedElements.action === "CUT") {
        // do copy action
        state.pages[targetPageIndex] = updatedPage;

        // then remove the original lines and coords from the source page
        const copiedLineIds = state.copiedElements.elements.map((line) => line.id);
        const originalPageId = state.copiedElements.pageId;
        const originalPage = state.pages.find((page) => page.id === originalPageId)!;
        const originalPageIndex = state.pages.findIndex((page) => page.id === originalPageId);

        const filteredOriginalCoordinates = originalPage.coordinates?.filter(
          (coord) =>
            !originalPage.lines
              ?.filter((line) => copiedLineIds.includes(line.id))
              .some((line) => line.coordRefs.includes(coord.id)),
        );

        const filteredOriginalLines = originalPage.lines?.filter((line) => !copiedLineIds.includes(line.id));

        state.pages[originalPageIndex] = {
          ...originalPage,
          coordinates: filteredOriginalCoordinates,
          lines: filteredOriginalLines,
        };
      } else {
        // If it's a copy action, just update the page with the new lines and coords
        state.pages[targetPageIndex] = updatedPage;
      }
    },
    replaceDiagramsAndPage: (state, action: PayloadAction<{ diagrams: DiagramDTO[]; page?: PageDTO }>) => {
      onDataChanging(state);
      action.payload.diagrams.forEach((diagram: DiagramDTO) => {
        const index = state.diagrams.findIndex((d) => d.id === diagram.id);
        state.diagrams[index] = diagram;
      });

      if (action.payload.page) {
        const pageIndex = state.pages.findIndex((p) => p.id === action.payload.page?.id);
        if (pageIndex !== -1) {
          state.pages[pageIndex] = action.payload.page;
        } else {
          state.pages.push(action.payload.page);
        }
      }
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
    setSelectedElementIds: (state, action: PayloadAction<string[]>) => {
      state.selectedElementIds = action.payload;
    },
    setLastUpdatedLineStyle: (state, action: PayloadAction<string>) => {
      state.lastUpdatedLineStyle = action.payload;
    },
    setLastUpdatedLabelStyle: (state, action: PayloadAction<{ font?: string; fontSize?: number }>) => {
      state.lastUpdatedLabelStyle = action.payload;
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

      let lineToChange = undefined;
      searchDiagramLines: for (const diagram of state.diagrams) {
        for (const line of diagram.lines ?? []) {
          if (line.id.toString() === id) {
            lineToChange = line;
            break searchDiagramLines;
          }
        }
      }

      searchPageLines: for (const page of state.pages) {
        for (const line of page.lines ?? []) {
          if (line.id.toString() === id) {
            lineToChange = line;
            break searchPageLines;
          }
        }
      }

      if (!lineToChange) return;
      const lineIsHidden = ["hide", "systemHide"].includes(lineToChange.displayState ?? "");
      if (lineIsHidden === hide) return;

      onDataChanging(state);

      lineToChange.displayState = hide ? DisplayStateEnum.hide : DisplayStateEnum.display;
    },
    setCopiedElements: (
      state,
      action: PayloadAction<{ ids: number[]; type: string; action: "COPY" | "CUT"; pageId: number }>,
    ) => {
      const { ids, type, pageId } = action.payload;
      if (ids.length === 0) return;

      if (action.payload.action === "CUT") {
        onDataChanging(state);
      }

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
          type: "label",
          pageId,
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
          type: "line",
          pageId,
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

      if (state.copiedElements && (state.copiedElements.action === "CUT" || state.copiedElements.action === "PASTE")) {
        state.copiedElements.action = "COPY";
      }

      state.hasChanges = state.previousHasChanges ?? false;
      if (!state.hasChanges) {
        state.lastChangedAt = undefined;
      }

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
    setViewableLabelTypes: (state, action: PayloadAction<string[]>) => {
      state.viewableLabelTypes = action.payload;
    },
    updateMaxElemIds: (state, action: PayloadAction<{ element: string; maxId: number }>) => {
      const { element, maxId } = action.payload;
      if (state.configs && state.configs[0]) {
        state.configs[0].maxElemIds.forEach((elem) => {
          if (elem.element === element) {
            elem.maxId = maxId;
          }
        });
      }
    },
  },
  selectors: {
    getPlanData: (state) => ({ diagrams: state.diagrams, lastModifiedAt: state.lastModifiedAt, pages: state.pages }),
    getDiagrams: (state) => state.diagrams,
    getPages: (state) => state.pages,
    getConfigs: (state) => state.configs,
    getLastModifiedAt: (state) => state.lastModifiedAt,
    getActiveSheet: (state) => state.activeSheet,
    getPageConfigs: (state) => state.configs?.[0]?.pageConfigs ?? [],
    getElementTypeConfigs: (state) => state.configs?.[0]?.elementTypeConfigs ?? [],
    getMaxElemIds: (state) => state.configs?.[0]?.maxElemIds ?? [],
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
    getPageByRef: (state) => (pageID: number) => {
      return state.pages.find((page) => page.id === pageID);
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
    getLastChangedAt: (state) => state.lastChangedAt,
    getPlanMode: (state) => state.planMode,
    getSelectedElementIds: (state) => state.selectedElementIds,
    getLastUpdatedLineStyle: (state) => state.lastUpdatedLineStyle,
    getLastUpdatedLabelStyle: (state) => state.lastUpdatedLabelStyle,
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
    getViewableLabelTypes: (state) => state.viewableLabelTypes,
  },
});

export const {
  setPlanData,
  recoverAutoSave,
  replaceDiagrams,
  replacePage,
  replaceDiagramsAndPage,
  setActiveSheet,
  setActivePageNumber,
  removeDiagramPageRef,
  setDiagramPageRef,
  updatePages,
  doPastePageLabels,
  doPastePageLines,
  setPlanMode,
  setLastUpdatedLineStyle,
  setLastUpdatedLabelStyle,
  setAlignedLabelNodeId,
  setDiagramIdToMove,
  setSelectedElementIds,
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
  setViewableLabelTypes,
  updateMaxElemIds,
} = planSheetsSlice.actions;

export const {
  getPlanData,
  getConfigs,
  getDiagrams,
  getLastModifiedAt,
  getPages,
  getActivePages,
  getActivePage,
  getActiveSheet,
  getPageConfigs,
  getElementTypeConfigs,
  getMaxElemIds,
  getPageByRef,
  getPageNumberFromPageRef,
  getPageRefFromPageNumber,
  getActivePageRefFromPageNumber,
  getActivePageNumber,
  getFilteredPages,
  getSelectedElementIds,
  getOriginalPositions,
  hasChanges,
  getLastChangedAt,
  getPlanMode,
  getLastUpdatedLineStyle,
  getLastUpdatedLabelStyle,
  getCopiedElements,
  getAlignedLabelNodeId,
  getDiagramIdToMove,
  getPreviousAttributesForDiagram,
  canUndo,
  getCanViewHiddenLabels,
  hasNavigateAfterSave,
  getViewableLabelTypes,
} = planSheetsSlice.selectors;

export default planSheetsSlice;
