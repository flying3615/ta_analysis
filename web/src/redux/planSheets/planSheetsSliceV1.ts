import {
  CoordinateDTO,
  DiagramDTO,
  DisplayStateEnum,
  PageDTO,
  PlanResponseDTO,
} from "@linz/survey-plan-generation-api-client";
import { LabelDTO } from "@linz/survey-plan-generation-api-client";
import { LineDTO } from "@linz/survey-plan-generation-api-client";
import { PayloadAction } from "@reduxjs/toolkit";
import { cloneDeep } from "lodash-es";

import { ElementToMove } from "@/components/PlanSheets/interactions/MoveElementToPageModal";
import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { LookupOriginalCoord } from "@/modules/plan/LookupOriginalCoord";
import { PreviousDiagramAttributes } from "@/modules/plan/PreviousDiagramAttributes";

import { Optional, PlanSheetsStateV1 } from "./planSheetsSliceUtils";

/**
 * Call this *before* any action changes diagrams or pages
 * Include here anything we want to update based on the old
 * state
 *
 * NOTE: in React dev mode, the Redux actions can be called twice.
 * You need to determine based on state if you are making
 * the substantive change - see `setLineHide` etc.
 */
const onDataChanging = (state: PlanSheetsStateV1) => {
  state.previousHasChanges = state.hasChanges;
  state.previousDiagrams = cloneDeep(state.diagrams);
  state.previousPages = cloneDeep(state.pages);
  state.hasChanges = true;
  // for auto-recovery to detect when data changed
  state.lastChangedAt = new Date().toISOString();
};

export const reducersV1 = {
  setPlanData: (state: PlanSheetsStateV1, action: PayloadAction<Optional<PlanResponseDTO, "configs">>) => {
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
  replaceDiagrams: (state: PlanSheetsStateV1, action: PayloadAction<DiagramDTO[]>) => {
    onDataChanging(state);
    action.payload.forEach((diagram) => {
      const index = state.diagrams.findIndex((d) => d.id === diagram.id);
      state.diagrams[index] = diagram;
    });
  },
  replacePage: (
    state: PlanSheetsStateV1,
    action: PayloadAction<{ updatedPage: PageDTO; applyOnDataChanging?: boolean }>,
  ) => {
    const { updatedPage, applyOnDataChanging } = action.payload;
    (applyOnDataChanging ?? true) && onDataChanging(state);
    const index = state.pages.findIndex((page) => page.id === updatedPage.id);
    state.pages[index] = updatedPage;
  },
  doPastePageLabels: (state: PlanSheetsStateV1, action: PayloadAction<{ updatedPage: PageDTO }>) => {
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
  doPastePageLines: (state: PlanSheetsStateV1, action: PayloadAction<{ updatedPage: PageDTO }>) => {
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
  replaceDiagramsAndPage: (
    state: PlanSheetsStateV1,
    action: PayloadAction<{ diagrams: DiagramDTO[]; page?: PageDTO }>,
  ) => {
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
  setActiveSheet: (state: PlanSheetsStateV1, action: PayloadAction<PlanSheetType>) => {
    state.activeSheet = action.payload;
  },
  setActivePageNumber: (
    state: PlanSheetsStateV1,
    action: PayloadAction<{ pageType: PlanSheetType; pageNumber: number }>,
  ) => {
    state.activePageNumbers[action.payload.pageType] = action.payload.pageNumber;
  },
  setDiagramPageRef: (
    state: PlanSheetsStateV1,
    action: PayloadAction<{ id: number; pageRef: number | undefined; adjustDiagram: (d: DiagramDTO) => DiagramDTO }>,
  ) => {
    onDataChanging(state);
    const { id, pageRef, adjustDiagram } = action.payload;
    state.diagrams = state.diagrams.map((d) => (d.id === id ? { ...adjustDiagram(d), pageRef } : d));
  },
  removeDiagramPageRef: (state: PlanSheetsStateV1, action: PayloadAction<number>) => {
    onDataChanging(state);
    state.diagrams.forEach((diagram) => {
      if (diagram.pageRef === action.payload) {
        diagram.pageRef = undefined;
      }
    });
  },
  setLabelsPageRef: (
    state: PlanSheetsStateV1,
    action: PayloadAction<{ ids: string[]; pageRef: number | undefined }>,
  ) => {
    const { ids, pageRef } = action.payload;

    const convertedIds = ids.map((id) => {
      if (id.startsWith("LAB_")) {
        return Number(id.replace("LAB_", ""));
      }
      return id;
    });

    // Collect labels to be moved
    const movedLabels = state.pages
      .flatMap((page) => page.labels)
      .filter((label) => label && convertedIds.includes(label.id));

    // Remove labels from their current pages
    state.pages.forEach((page) => {
      page.labels = page.labels?.filter((label) => !convertedIds.includes(label.id));
    });

    // Add labels to the target page
    const targetPage = state.pages.find((page) => page.id === pageRef);
    if (targetPage && movedLabels.length > 0) {
      targetPage.labels = [...(targetPage.labels ?? []), ...movedLabels] as LabelDTO[];
    }
  },
  setLinesPageRef: (
    state: PlanSheetsStateV1,
    action: PayloadAction<{ ids: string[]; pageRef: number | undefined }>,
  ) => {
    const { ids, pageRef } = action.payload;

    // Collect lines to be moved
    const movedLines = state.pages
      .flatMap((page) => page.lines)
      .filter((line) => line && ids.includes(line.id.toString()))
      .filter((line) => line !== undefined);

    if (!movedLines || movedLines.length === 0) return;

    // Collect coordinates to be moved
    const coordRefs = movedLines.flatMap((line) => line && line.coordRefs);
    const movedCoordinates = state.pages
      .flatMap((page) => page.coordinates)
      .filter((coord) => coord && coordRefs.includes(coord.id))
      .filter((coord) => coord !== undefined);

    if (!movedCoordinates || movedCoordinates.length === 0) return;

    // Remove lines and coordinates from their current pages
    state.pages.forEach((page) => {
      page.coordinates = page.coordinates?.filter((coord) => !coordRefs.includes(coord.id));
    });
    state.pages.forEach((page) => {
      page.lines = page.lines?.filter((line) => !ids.includes(line.id.toString()));
    });

    // Add lines and coordinates to the target page
    const targetPage = state.pages.find((page) => page.id === pageRef);
    if (targetPage) {
      targetPage.coordinates = [...(targetPage.coordinates ?? []), ...movedCoordinates] as CoordinateDTO[];
      targetPage.lines = [...(targetPage.lines ?? []), ...movedLines] as LineDTO[];
    }
  },
  updatePages: (state: PlanSheetsStateV1, action: PayloadAction<PageDTO[]>) => {
    onDataChanging(state);
    state.pages = action.payload;
  },
  setPlanMode: (state: PlanSheetsStateV1, action: PayloadAction<PlanMode>) => {
    // keep selected labels when toggling select_target_line/select_label mode
    const isToggleSelectTargetLine =
      (state.planMode === PlanMode.SelectTargetLine && action.payload === PlanMode.SelectLabel) ||
      (state.planMode === PlanMode.SelectLabel && action.payload === PlanMode.SelectTargetLine);

    if (!isToggleSelectTargetLine) {
      state.selectedElementIds = [];
    }

    state.planMode = action.payload;
  },
  setSelectedElementIds: (state: PlanSheetsStateV1, action: PayloadAction<string[]>) => {
    state.selectedElementIds = action.payload;
  },
  setLastUpdatedLineStyle: (state: PlanSheetsStateV1, action: PayloadAction<string>) => {
    state.lastUpdatedLineStyle = action.payload;
  },
  setLastUpdatedLabelStyle: (state: PlanSheetsStateV1, action: PayloadAction<{ font?: string; fontSize?: number }>) => {
    state.lastUpdatedLabelStyle = action.payload;
  },
  setAlignedLabelNodeId: (state: PlanSheetsStateV1, action: PayloadAction<{ nodeId: string }>) => {
    state.alignedLabelNodeId = action.payload.nodeId;
  },
  setElementsToMove: (state: PlanSheetsStateV1, action: PayloadAction<ElementToMove[] | undefined>) => {
    state.elementsToMove = action.payload;
  },
  setSymbolHide: (state: PlanSheetsStateV1, action: PayloadAction<{ id: string; hide: boolean }>) => {
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
  setPreviousDiagramAttributes: (state: PlanSheetsStateV1, action: PayloadAction<PreviousDiagramAttributes>) => {
    state.previousDiagramAttributesMap[action.payload.id] = action.payload;
  },
  setLineHide: (state: PlanSheetsStateV1, action: PayloadAction<{ id: string; hide: boolean }>) => {
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
    state: PlanSheetsStateV1,
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
  removePageLines: (state: PlanSheetsStateV1, action: PayloadAction<{ lineIds: string[] }>) => {
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
  removePageLabels: (state: PlanSheetsStateV1, action: PayloadAction<{ labelIds: number[] }>) => {
    const { labelIds } = action.payload;

    onDataChanging(state);

    state.pages.forEach((page) => {
      page.labels = page.labels?.filter((label) => !labelIds.includes(label.id));
    });
  },
  undo: (state: PlanSheetsStateV1) => {
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
  clearUndo: (state: PlanSheetsStateV1) => {
    state.previousHasChanges = false;
    state.previousDiagrams = null;
    state.previousPages = null;
  },
  setCanViewHiddenLabels: (state: PlanSheetsStateV1, action: PayloadAction<boolean>) => {
    state.canViewHiddenLabels = action.payload;
  },
  navigateAfterSave: (state: PlanSheetsStateV1, action: PayloadAction<string | undefined>) => {
    state.navigateAfterSave = action.payload;
  },
  setViewableLabelTypes: (state: PlanSheetsStateV1, action: PayloadAction<string[]>) => {
    state.viewableLabelTypes = action.payload;
  },
  updateMaxElemIds: (state: PlanSheetsStateV1, action: PayloadAction<{ element: string; maxId: number }>) => {
    const { element, maxId } = action.payload;
    if (state.configs && state.configs[0]) {
      state.configs[0].maxElemIds.forEach((elem) => {
        if (elem.element === element) {
          elem.maxId = maxId;
        }
      });
    }
  },
};

export const selectorsV1 = {
  getPlanData: (state: PlanSheetsStateV1) => ({
    diagrams: state.diagrams,
    lastModifiedAt: state.lastModifiedAt,
    pages: state.pages,
  }),
  getDiagrams: (state: PlanSheetsStateV1) => state.diagrams,
  getPages: (state: PlanSheetsStateV1) => state.pages,
  getConfigs: (state: PlanSheetsStateV1) => state.configs,
  getLastModifiedAt: (state: PlanSheetsStateV1) => state.lastModifiedAt,
  getActiveSheet: (state: PlanSheetsStateV1) => state.activeSheet,
  getPageConfigs: (state: PlanSheetsStateV1) => state.configs?.[0]?.pageConfigs ?? [],
  getElementTypeConfigs: (state: PlanSheetsStateV1) => state.configs?.[0]?.elementTypeConfigs ?? [],
  getMaxElemIds: (state: PlanSheetsStateV1) => state.configs?.[0]?.maxElemIds ?? [],
  getPageNumberFromPageRef: (state: PlanSheetsStateV1) => (pageID: number) => {
    const page = state.pages.find((page) => page.pageType === state.activeSheet && page.id === pageID);
    return page?.pageNumber ?? null;
  },
  getActivePageRefFromPageNumber: (state: PlanSheetsStateV1) => {
    const page = state.pages.find(
      (page) => page.pageType === state.activeSheet && page.pageNumber === state.activePageNumbers[state.activeSheet],
    );
    return page?.id ?? null;
  },
  getPageByRef: (state: PlanSheetsStateV1) => (pageID: number) => {
    return state.pages.find((page) => page.id === pageID);
  },
  getPageRefFromPageNumber: (state: PlanSheetsStateV1) => (pageNumber: number) => {
    const page = state.pages.find((page) => page.pageType === state.activeSheet && page.pageNumber === pageNumber);
    return page?.id ?? null;
  },
  getActivePages: (state: PlanSheetsStateV1) => {
    return state.pages.filter((page) => state.activeSheet === page.pageType);
  },
  getActivePage: (state: PlanSheetsStateV1) => {
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
  getActivePageNumber: (state: PlanSheetsStateV1) => {
    const pageType = state.activeSheet;
    return state.activePageNumbers[pageType];
  },
  getCopiedElements: (state: PlanSheetsStateV1) => state.copiedElements,
  getFilteredPages: (state: PlanSheetsStateV1) => {
    const filteredPages = state.pages.filter((page) => page.pageType === state.activeSheet);
    return {
      totalPages: filteredPages.length,
    };
  },
  getOriginalPositions: (state: PlanSheetsStateV1) => state.originalPositions,
  hasChanges: (state: PlanSheetsStateV1) => state.hasChanges,
  getLastChangedAt: (state: PlanSheetsStateV1) => state.lastChangedAt,
  getPlanMode: (state: PlanSheetsStateV1) => state.planMode,
  getSelectedElementIds: (state: PlanSheetsStateV1) => state.selectedElementIds,
  getLastUpdatedLineStyle: (state: PlanSheetsStateV1) => state.lastUpdatedLineStyle,
  getLastUpdatedLabelStyle: (state: PlanSheetsStateV1) => state.lastUpdatedLabelStyle,
  getAlignedLabelNodeId: (state: PlanSheetsStateV1) => state.alignedLabelNodeId,
  getElementsToMove: (state: PlanSheetsStateV1) => state.elementsToMove,
  getPreviousAttributesForDiagram:
    (state: PlanSheetsStateV1) =>
    (id: number): PreviousDiagramAttributes | undefined => {
      return state.previousDiagramAttributesMap[id];
    },
  canUndo: (state: PlanSheetsStateV1) => state.previousDiagrams != null && state.previousPages != null,
  getCanViewHiddenLabels: (state: PlanSheetsStateV1) => state.canViewHiddenLabels,
  hasNavigateAfterSave: (state: PlanSheetsStateV1) => state.navigateAfterSave,
  getViewableLabelTypes: (state: PlanSheetsStateV1) => state.viewableLabelTypes,
};
