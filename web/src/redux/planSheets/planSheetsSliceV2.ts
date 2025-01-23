import { DiagramDTO, DisplayStateEnum, PageDTO, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { LabelDTO } from "@linz/survey-plan-generation-api-client";
import { LineDTO } from "@linz/survey-plan-generation-api-client";
import { PayloadAction } from "@reduxjs/toolkit";

import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { LookupOriginalCoord } from "@/modules/plan/LookupOriginalCoord";
import { PreviousDiagramAttributes } from "@/modules/plan/PreviousDiagramAttributes";

import { Optional, PlanSheetsStateV2, State } from "./planSheetsSliceUtils";

/**
 * Wrap your action with this for any action with changes to record,
 * This function will save the action that was executed on current to be called next state change on past
 *
 * NOTE: in React dev mode, the Redux actions can be called twice.
 * You need to determine based on state if you are making
 * the substantive change - see `setLineHide` etc.
 */
const recordState = (state: PlanSheetsStateV2, fn: (sheetState: State) => void) => {
  if (state.replayAction !== undefined) {
    state.replayAction(state.past);
  }
  const playAction = (sheetState: State) => {
    sheetState.hasChanges = true;
    fn(sheetState);
  };
  state.replayAction = playAction;
  playAction(state.current);
};

/**
 * Wrap your action with this to keep both past and current in sync
 */
const syncStateChange = (state: PlanSheetsStateV2, fn: (sheetState: State) => void) => {
  fn(state.current);
  fn(state.past);
};

export const reducersV2 = {
  setPlanData: (state: PlanSheetsStateV2, action: PayloadAction<Optional<PlanResponseDTO, "configs">>) => {
    state.current.configs = action.payload.configs;
    state.current.diagrams = action.payload.diagrams;
    state.current.lastModifiedAt = action.payload.lastModifiedAt;
    state.current.pages = action.payload.pages;
    state.current.hasChanges = false;
    state.current.lastChangedAt = undefined;

    const sheetTypes = [PlanSheetType.TITLE, PlanSheetType.SURVEY];
    sheetTypes.forEach((type) => {
      if (state.current.pages.some((page) => page.pageType === type) && !state.current.activePageNumbers[type]) {
        state.current.activePageNumbers[type] = 1;
      }
    });
    state.current.originalPositions = LookupOriginalCoord(action.payload.diagrams);
    state.past = state.current;
    state.replayAction = undefined;
  },
  replaceDiagrams: (state: PlanSheetsStateV2, action: PayloadAction<DiagramDTO[]>) => {
    recordState(state, (sheetState) => {
      action.payload.forEach((diagram) => {
        const index = sheetState.diagrams.findIndex((d) => d.id === diagram.id);
        sheetState.diagrams[index] = diagram;
      });
    });
  },
  replacePage: (
    state: PlanSheetsStateV2,
    action: PayloadAction<{ updatedPage: PageDTO; applyOnDataChanging?: boolean }>,
  ) => {
    const { updatedPage, applyOnDataChanging } = action.payload; // TODO change name of applyOnDataChanging
    const fn = (sheetState: State) => {
      const index = sheetState.pages.findIndex((page) => page.id === updatedPage.id);
      sheetState.pages[index] = updatedPage;
    };
    if (applyOnDataChanging ?? true) {
      recordState(state, fn);
    } else {
      fn(state.current);
    }
  },
  doPastePageLabels: (state: PlanSheetsStateV2, action: PayloadAction<{ updatedPage: PageDTO }>) => {
    const { updatedPage } = action.payload;
    recordState(state, (sheetState) => {
      const targetPageIndex = sheetState.pages.findIndex((page) => page.id === updatedPage.id);

      if (!sheetState.copiedElements) return;

      if (sheetState.copiedElements.action === "CUT") {
        // do copy action
        sheetState.pages[targetPageIndex] = updatedPage;

        // then remove the original label from the source page
        const originalPageId = sheetState.copiedElements.pageId;
        const originalPage = sheetState.pages.find((page) => page.id === originalPageId)!;
        const originalPageIndex = sheetState.pages.findIndex((page) => page.id === originalPageId);
        const originalLabels = originalPage?.labels?.filter(
          (label) => !sheetState.copiedElements?.elements.some((el) => el.id === label.id),
        );
        sheetState.pages[originalPageIndex] = { ...originalPage, labels: originalLabels };
      } else {
        // If it's a copy action, just update the page with the new labels
        sheetState.pages[targetPageIndex] = updatedPage;
      }
      sheetState.copiedElements.action = "PASTE";
    });
  },
  doPastePageLines: (state: PlanSheetsStateV2, action: PayloadAction<{ updatedPage: PageDTO }>) => {
    const { updatedPage } = action.payload;
    recordState(state, (sheetState) => {
      if (!sheetState.copiedElements) return;

      const targetPageIndex = sheetState.pages.findIndex((page) => page.id === updatedPage.id);
      if (sheetState.copiedElements.action === "CUT") {
        // do copy action
        sheetState.pages[targetPageIndex] = updatedPage;

        // then remove the original lines and coords from the source page
        const copiedLineIds = sheetState.copiedElements.elements.map((line) => line.id);
        const originalPageId = sheetState.copiedElements.pageId;
        const originalPage = sheetState.pages.find((page) => page.id === originalPageId)!;
        const originalPageIndex = sheetState.pages.findIndex((page) => page.id === originalPageId);

        const filteredOriginalCoordinates = originalPage.coordinates?.filter(
          (coord) =>
            !originalPage.lines
              ?.filter((line) => copiedLineIds.includes(line.id))
              .some((line) => line.coordRefs.includes(coord.id)),
        );

        const filteredOriginalLines = originalPage.lines?.filter((line) => !copiedLineIds.includes(line.id));

        sheetState.pages[originalPageIndex] = {
          ...originalPage,
          coordinates: filteredOriginalCoordinates,
          lines: filteredOriginalLines,
        };
      } else {
        // If it's a copy action, just update the page with the new lines and coords
        sheetState.pages[targetPageIndex] = updatedPage;
      }
    });
  },
  replaceDiagramsAndPage: (
    state: PlanSheetsStateV2,
    action: PayloadAction<{ diagrams: DiagramDTO[]; page?: PageDTO }>,
  ) => {
    recordState(state, (sheetState) => {
      action.payload.diagrams.forEach((diagram: DiagramDTO) => {
        const index = sheetState.diagrams.findIndex((d) => d.id === diagram.id);
        sheetState.diagrams[index] = diagram;
      });

      if (action.payload.page) {
        const pageIndex = sheetState.pages.findIndex((p) => p.id === action.payload.page?.id);
        if (pageIndex !== -1) {
          sheetState.pages[pageIndex] = action.payload.page;
        } else {
          sheetState.pages.push(action.payload.page);
        }
      }

      // for auto-recovery to detect when data changed
      sheetState.lastChangedAt = new Date().toISOString();
    });
  },
  setActiveSheet: (state: PlanSheetsStateV2, action: PayloadAction<PlanSheetType>) => {
    syncStateChange(state, (sheetState) => (sheetState.activeSheet = action.payload));
  },
  setActivePageNumber: (
    state: PlanSheetsStateV2,
    action: PayloadAction<{ pageType: PlanSheetType; pageNumber: number }>,
  ) => {
    syncStateChange(
      state,
      (sheetState) => (sheetState.activePageNumbers[action.payload.pageType] = action.payload.pageNumber),
    );
  },
  setDiagramPageRef: (
    state: PlanSheetsStateV2,
    action: PayloadAction<{ id: number; pageRef: number | undefined; adjustDiagram: (d: DiagramDTO) => DiagramDTO }>,
  ) => {
    recordState(state, (sheetState) => {
      const { id, pageRef, adjustDiagram } = action.payload;
      sheetState.diagrams = sheetState.diagrams.map((d) => (d.id === id ? { ...adjustDiagram(d), pageRef } : d));
    });
  },
  removeDiagramPageRef: (state: PlanSheetsStateV2, action: PayloadAction<number>) => {
    recordState(state, (sheetState) => {
      sheetState.diagrams.forEach((diagram) => {
        if (diagram.pageRef === action.payload) {
          diagram.pageRef = undefined;
        }
      });
    });
  },
  updatePages: (state: PlanSheetsStateV2, action: PayloadAction<PageDTO[]>) => {
    recordState(state, (sheetState) => {
      sheetState.pages = action.payload;
    });
  },
  setPlanMode: (state: PlanSheetsStateV2, action: PayloadAction<PlanMode>) => {
    syncStateChange(state, (sheetState) => {
      // keep selected labels when toggling select_target_line/select_label mode
      const isToggleSelectTargetLine =
        (sheetState.planMode === PlanMode.SelectTargetLine && action.payload === PlanMode.SelectLabel) ||
        (sheetState.planMode === PlanMode.SelectLabel && action.payload === PlanMode.SelectTargetLine);

      if (!isToggleSelectTargetLine) {
        sheetState.selectedElementIds = [];
      }

      sheetState.planMode = action.payload;
    });
  },
  setSelectedElementIds: (state: PlanSheetsStateV2, action: PayloadAction<string[]>) => {
    syncStateChange(state, (sheetState) => (sheetState.selectedElementIds = action.payload));
  },
  setLastUpdatedLineStyle: (state: PlanSheetsStateV2, action: PayloadAction<string>) => {
    syncStateChange(state, (sheetState) => (sheetState.lastUpdatedLineStyle = action.payload));
  },
  setLastUpdatedLabelStyle: (state: PlanSheetsStateV2, action: PayloadAction<{ font?: string; fontSize?: number }>) => {
    syncStateChange(state, (sheetState) => (sheetState.lastUpdatedLabelStyle = action.payload));
  },
  setAlignedLabelNodeId: (state: PlanSheetsStateV2, action: PayloadAction<{ nodeId: string }>) => {
    syncStateChange(state, (sheetState) => (sheetState.alignedLabelNodeId = action.payload.nodeId));
  },
  setDiagramIdToMove: (state: PlanSheetsStateV2, action: PayloadAction<number | undefined>) => {
    syncStateChange(state, (sheetState) => (sheetState.diagramIdToMove = action.payload));
  },
  setSymbolHide: (state: PlanSheetsStateV2, action: PayloadAction<{ id: string; hide: boolean }>) => {
    const { id, hide } = action.payload;

    recordState(state, (sheetState) => {
      const labelToChange = sheetState.diagrams.flatMap((diagram) => {
        return diagram.coordinateLabels.filter((label) => label.id.toString() === id);
      })[0];
      if (!labelToChange) return;
      const labelIsHidden = ["hide", "systemHide"].includes(labelToChange.displayState ?? "");
      if (labelIsHidden === hide) return;

      labelToChange.displayState = hide ? DisplayStateEnum.hide : DisplayStateEnum.display;
    });
  },
  setPreviousDiagramAttributes: (state: PlanSheetsStateV2, action: PayloadAction<PreviousDiagramAttributes>) => {
    state.current.previousDiagramAttributesMap[action.payload.id] = action.payload;
  },
  setLineHide: (state: PlanSheetsStateV2, action: PayloadAction<{ id: string; hide: boolean }>) => {
    const { id, hide } = action.payload;

    recordState(state, (sheetState) => {
      let lineToChange = undefined;
      searchDiagramLines: for (const diagram of sheetState.diagrams) {
        for (const line of diagram.lines ?? []) {
          if (line.id.toString() === id) {
            lineToChange = line;
            break searchDiagramLines;
          }
        }
      }

      searchPageLines: for (const page of sheetState.pages) {
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

      lineToChange.displayState = hide ? DisplayStateEnum.hide : DisplayStateEnum.display;
    });
  },
  setCopiedElements: (
    state: PlanSheetsStateV2,
    action: PayloadAction<{ ids: number[]; type: string; action: "COPY" | "CUT"; pageId: number }>,
  ) => {
    const { ids, type, pageId } = action.payload;
    if (ids.length === 0) return;

    const fn = (sheetState: State) => {
      if (type === "label") {
        const targetLabels: LabelDTO[] = [];
        sheetState.pages.forEach((page) => {
          const copiedLabels = page.labels?.filter((label) => ids.includes(label.id));
          if (copiedLabels && copiedLabels.length > 0 && copiedLabels[0] !== undefined) {
            targetLabels.push(...copiedLabels);
          }
        });
        sheetState.copiedElements = {
          elements: targetLabels,
          action: action.payload.action,
          type: "label",
          pageId,
        };
      } else {
        const targetLines: LineDTO[] = [];
        sheetState.pages.forEach((page) => {
          const copiedLines = page.lines?.filter((line) => ids.includes(line.id));
          if (copiedLines && copiedLines.length > 0 && copiedLines[0] !== undefined) {
            targetLines.push(copiedLines[0]);
          }
        });
        sheetState.copiedElements = {
          elements: targetLines,
          action: action.payload.action,
          type: "line",
          pageId,
        };
      }
    };
    if (action.payload.action === "CUT") {
      recordState(state, fn);
    } else {
      fn(state.current);
    }
  },
  removePageLines: (state: PlanSheetsStateV2, action: PayloadAction<{ lineIds: string[] }>) => {
    const { lineIds } = action.payload;

    recordState(state, (sheetState: State) => {
      sheetState.pages.forEach((page) => {
        const linesToRemove = page.lines?.filter((line) => lineIds.includes(line.id.toString())) ?? [];
        page.lines = page.lines?.filter((line) => !linesToRemove.includes(line));

        //also remove any page coordinates from the removed lines that are not referenced by any other lines
        const coordinatesToRemove = linesToRemove
          .flatMap((line) => line.coordRefs)
          .filter((coordRef) => !page.lines?.some((line) => line.coordRefs.includes(coordRef)));
        page.coordinates = page.coordinates?.filter((coord) => !coordinatesToRemove.includes(coord.id));
      });
    });
  },
  removePageLabels: (state: PlanSheetsStateV2, action: PayloadAction<{ labelIds: number[] }>) => {
    const { labelIds } = action.payload;

    recordState(state, (sheetState: State) => {
      sheetState.pages.forEach((page) => {
        page.labels = page.labels?.filter((label) => !labelIds.includes(label.id));
      });
    });
  },
  undo: (state: PlanSheetsStateV2) => {
    if (state.past) {
      state.current = state.past;
      state.replayAction = undefined;
    }
  },
  clearUndo: (state: PlanSheetsStateV2) => {
    state.replayAction = undefined;
    state.past = state.current;
  },
  setCanViewHiddenLabels: (state: PlanSheetsStateV2, action: PayloadAction<boolean>) => {
    syncStateChange(state, (sheetState) => (sheetState.canViewHiddenLabels = action.payload));
  },
  navigateAfterSave: (state: PlanSheetsStateV2, action: PayloadAction<string | undefined>) => {
    syncStateChange(state, (sheetState) => (sheetState.navigateAfterSave = action.payload));
  },
  setViewableLabelTypes: (state: PlanSheetsStateV2, action: PayloadAction<string[]>) => {
    syncStateChange(state, (sheetState) => (sheetState.viewableLabelTypes = action.payload));
  },
  updateMaxElemIds: (state: PlanSheetsStateV2, action: PayloadAction<{ element: string; maxId: number }>) => {
    const { element, maxId } = action.payload;
    recordState(state, (sheetState) => {
      if (sheetState.configs && sheetState.configs[0]) {
        sheetState.configs[0].maxElemIds.forEach((elem) => {
          if (elem.element === element) {
            elem.maxId = maxId;
          }
        });
      }
    });
  },
};

export const selectorsV2 = {
  getPlanData: (state: PlanSheetsStateV2) => ({
    diagrams: state.current.diagrams,
    lastModifiedAt: state.current.lastModifiedAt,
    pages: state.current.pages,
  }),
  getDiagrams: (state: PlanSheetsStateV2) => state.current.diagrams,
  getPages: (state: PlanSheetsStateV2) => state.current.pages,
  getConfigs: (state: PlanSheetsStateV2) => state.current.configs,
  getLastModifiedAt: (state: PlanSheetsStateV2) => state.current.lastModifiedAt,
  getActiveSheet: (state: PlanSheetsStateV2) => state.current.activeSheet,
  getPageConfigs: (state: PlanSheetsStateV2) => state.current.configs?.[0]?.pageConfigs ?? [],
  getElementTypeConfigs: (state: PlanSheetsStateV2) => state.current.configs?.[0]?.elementTypeConfigs ?? [],
  getMaxElemIds: (state: PlanSheetsStateV2) => state.current.configs?.[0]?.maxElemIds ?? [],
  getPageNumberFromPageRef: (state: PlanSheetsStateV2) => (pageID: number) => {
    const page = state.current.pages.find((page) => page.pageType === state.current.activeSheet && page.id === pageID);
    return page?.pageNumber ?? null;
  },
  getActivePageRefFromPageNumber: (state: PlanSheetsStateV2) => {
    const page = state.current.pages.find(
      (page) =>
        page.pageType === state.current.activeSheet &&
        page.pageNumber === state.current.activePageNumbers[state.current.activeSheet],
    );
    return page?.id ?? null;
  },
  getPageByRef: (state: PlanSheetsStateV2) => (pageID: number) => {
    return state.current.pages.find((page) => page.id === pageID);
  },
  getPageRefFromPageNumber: (state: PlanSheetsStateV2) => (pageNumber: number) => {
    const page = state.current.pages.find(
      (page) => page.pageType === state.current.activeSheet && page.pageNumber === pageNumber,
    );
    return page?.id ?? null;
  },
  getActivePages: (state: PlanSheetsStateV2) => {
    return state.current.pages.filter((page) => state.current.activeSheet === page.pageType);
  },
  getActivePage: (state: PlanSheetsStateV2) => {
    const activePageNumber = state.current.activePageNumbers[state.current.activeSheet];

    let activePage = state.current.pages.find(
      (page) => state.current.activeSheet === page.pageType && page.pageNumber === activePageNumber,
    );

    // if the copied elements are cut, remove them from the active page
    if (state.current.copiedElements && state.current.copiedElements.action === "CUT") {
      if (activePage) {
        const updatedLabels = activePage.labels?.filter(
          (label) => !state.current.copiedElements?.elements.some((el) => el.id === label.id),
        );
        activePage = { ...activePage, labels: updatedLabels };

        const updatedLines = activePage.lines?.filter(
          (line) => !state.current.copiedElements?.elements.some((el) => el.id === line.id),
        );
        activePage = { ...activePage, lines: updatedLines };
      }
    }

    return activePage;
  },
  getActivePageNumber: (state: PlanSheetsStateV2) => {
    const pageType = state.current.activeSheet;
    return state.current.activePageNumbers[pageType];
  },
  getCopiedElements: (state: PlanSheetsStateV2) => state.current.copiedElements,
  getFilteredPages: (state: PlanSheetsStateV2) => {
    const filteredPages = state.current.pages.filter((page) => page.pageType === state.current.activeSheet);
    return {
      totalPages: filteredPages.length,
    };
  },
  getOriginalPositions: (state: PlanSheetsStateV2) => state.current.originalPositions,
  hasChanges: (state: PlanSheetsStateV2) => state.current.hasChanges,
  getLastChangedAt: (state: PlanSheetsStateV2) => state.current.lastChangedAt,
  getPlanMode: (state: PlanSheetsStateV2) => state.current.planMode,
  getSelectedElementIds: (state: PlanSheetsStateV2) => state.current.selectedElementIds,
  getLastUpdatedLineStyle: (state: PlanSheetsStateV2) => state.current.lastUpdatedLineStyle,
  getLastUpdatedLabelStyle: (state: PlanSheetsStateV2) => state.current.lastUpdatedLabelStyle,
  getAlignedLabelNodeId: (state: PlanSheetsStateV2) => state.current.alignedLabelNodeId,
  getDiagramIdToMove: (state: PlanSheetsStateV2) => state.current.diagramIdToMove,
  getPreviousAttributesForDiagram:
    (state: PlanSheetsStateV2) =>
    (id: number): PreviousDiagramAttributes | undefined => {
      return state.current.previousDiagramAttributesMap[id];
    },
  canUndo: (state: PlanSheetsStateV2) => state.replayAction !== undefined,
  getCanViewHiddenLabels: (state: PlanSheetsStateV2) => state.current.canViewHiddenLabels,
  hasNavigateAfterSave: (state: PlanSheetsStateV2) => state.current.navigateAfterSave,
  getViewableLabelTypes: (state: PlanSheetsStateV2) => state.current.viewableLabelTypes,
};
