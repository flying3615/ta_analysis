import { DiagramDTO, PageDTO, PlanResponseDTO } from "@linz/survey-plan-generation-api-client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ElementToMove } from "@/components/PlanSheets/interactions/MoveElementToPageModal";
import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { defaultOptionalVisibileLabelTypes } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { PreviousDiagramAttributes } from "@/modules/plan/PreviousDiagramAttributes";
import { revertAll } from "@/redux/revertAll";

import { Optional, PlanSheetsStateV1, PlanSheetsStateV2, State, UserEdit as UE } from "./planSheetsSliceUtils";
import { reducersV1, selectorsV1 } from "./planSheetsSliceV1";
import { reducersV2, selectorsV2 } from "./planSheetsSliceV2";
const IS_HIDDEN_OBJECTS_VISIBLE_STORAGE_KEY = "plangen.isHiddenObjectsVisibleByDefault";

export type PlanSheetsState = {
  stateVersion: string;
  v2: PlanSheetsStateV2;

  /**
   * @deprecated
   */
  v1: PlanSheetsStateV1;
};
export type UserEdit = UE;

const initialState: State = {
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
  viewableLabelTypes: defaultOptionalVisibileLabelTypes,
  originalPositions: {},
  canViewHiddenLabels: localStorage.getItem(IS_HIDDEN_OBJECTS_VISIBLE_STORAGE_KEY) !== "false",
  selectedElementIds: [],
};
const initialPlanSheetState: PlanSheetsState = {
  v1: {
    ...initialState,
    previousDiagrams: null,
    previousPages: null,
  },
  v2: {
    current: initialState,
    past: initialState,
  },
  stateVersion: "V1",
};

const planSheetsSlice = createSlice({
  name: "planSheets",
  initialState: initialPlanSheetState,
  extraReducers: (builder) => builder.addCase(revertAll, () => initialPlanSheetState),
  reducers: {
    setPlanData: (state: PlanSheetsState, action: PayloadAction<Optional<PlanResponseDTO, "configs">>) =>
      state.stateVersion === "V2" ? reducersV2.setPlanData(state.v2, action) : reducersV1.setPlanData(state.v1, action),
    replaceDiagrams: (state: PlanSheetsState, action: PayloadAction<DiagramDTO[]>) =>
      state.stateVersion === "V2"
        ? reducersV2.replaceDiagrams(state.v2, action)
        : reducersV1.replaceDiagrams(state.v1, action),
    replacePage: (
      state: PlanSheetsState,
      action: PayloadAction<{ updatedPage: PageDTO; applyOnDataChanging?: boolean }>,
    ) =>
      state.stateVersion === "V2" ? reducersV2.replacePage(state.v2, action) : reducersV1.replacePage(state.v1, action),
    doPastePageLabels: (state: PlanSheetsState, action: PayloadAction<{ updatedPage: PageDTO }>) =>
      state.stateVersion === "V2"
        ? reducersV2.doPastePageLabels(state.v2, action)
        : reducersV1.doPastePageLabels(state.v1, action),
    doPastePageLines: (state: PlanSheetsState, action: PayloadAction<{ updatedPage: PageDTO }>) =>
      state.stateVersion === "V2"
        ? reducersV2.doPastePageLines(state.v2, action)
        : reducersV1.doPastePageLines(state.v1, action),
    replaceDiagramsAndPage: (
      state: PlanSheetsState,
      action: PayloadAction<{ diagrams: DiagramDTO[]; page?: PageDTO }>,
    ) =>
      state.stateVersion === "V2"
        ? reducersV2.replaceDiagramsAndPage(state.v2, action)
        : reducersV1.replaceDiagramsAndPage(state.v1, action),
    setActiveSheet: (state: PlanSheetsState, action: PayloadAction<PlanSheetType>) =>
      state.stateVersion === "V2"
        ? reducersV2.setActiveSheet(state.v2, action)
        : reducersV1.setActiveSheet(state.v1, action),
    setActivePageNumber: (
      state: PlanSheetsState,
      action: PayloadAction<{ pageType: PlanSheetType; pageNumber: number }>,
    ) =>
      state.stateVersion === "V2"
        ? reducersV2.setActivePageNumber(state.v2, action)
        : reducersV1.setActivePageNumber(state.v1, action),
    setDiagramPageRef: (
      state: PlanSheetsState,
      action: PayloadAction<{ id: number; pageRef: number | undefined; adjustDiagram: (d: DiagramDTO) => DiagramDTO }>,
    ) =>
      state.stateVersion === "V2"
        ? reducersV2.setDiagramPageRef(state.v2, action)
        : reducersV1.setDiagramPageRef(state.v1, action),
    setLabelsPageRef: (
      state: PlanSheetsState,
      action: PayloadAction<{ ids: string[]; pageRef: number | undefined }>,
    ) => {
      state.stateVersion === "V2"
        ? reducersV2.setLabelsPageRef(state.v2, action)
        : reducersV1.setLabelsPageRef(state.v1, action);
    },
    removeDiagramPageRef: (state: PlanSheetsState, action: PayloadAction<number>) =>
      state.stateVersion === "V2"
        ? reducersV2.removeDiagramPageRef(state.v2, action)
        : reducersV1.removeDiagramPageRef(state.v1, action),
    updatePages: (state: PlanSheetsState, action: PayloadAction<PageDTO[]>) =>
      state.stateVersion === "V2" ? reducersV2.updatePages(state.v2, action) : reducersV1.updatePages(state.v1, action),
    setPlanMode: (state: PlanSheetsState, action: PayloadAction<PlanMode>) =>
      state.stateVersion === "V2" ? reducersV2.setPlanMode(state.v2, action) : reducersV1.setPlanMode(state.v1, action),
    setSelectedElementIds: (state: PlanSheetsState, action: PayloadAction<string[]>) =>
      state.stateVersion === "V2"
        ? reducersV2.setSelectedElementIds(state.v2, action)
        : reducersV1.setSelectedElementIds(state.v1, action),
    setLastUpdatedLineStyle: (state: PlanSheetsState, action: PayloadAction<string>) =>
      state.stateVersion === "V2"
        ? reducersV2.setLastUpdatedLineStyle(state.v2, action)
        : reducersV1.setLastUpdatedLineStyle(state.v1, action),
    setLastUpdatedLabelStyle: (state: PlanSheetsState, action: PayloadAction<{ font?: string; fontSize?: number }>) =>
      state.stateVersion === "V2"
        ? reducersV2.setLastUpdatedLabelStyle(state.v2, action)
        : reducersV1.setLastUpdatedLabelStyle(state.v1, action),
    setAlignedLabelNodeId: (state: PlanSheetsState, action: PayloadAction<{ nodeId: string }>) =>
      state.stateVersion === "V2"
        ? reducersV2.setAlignedLabelNodeId(state.v2, action)
        : reducersV1.setAlignedLabelNodeId(state.v1, action),
    setElementsToMove: (state: PlanSheetsState, action: PayloadAction<ElementToMove[] | undefined>) =>
      state.stateVersion === "V2"
        ? reducersV2.setElementsToMove(state.v2, action)
        : reducersV1.setElementsToMove(state.v1, action),
    setSymbolHide: (state: PlanSheetsState, action: PayloadAction<{ id: string; hide: boolean }>) =>
      state.stateVersion === "V2"
        ? reducersV2.setSymbolHide(state.v2, action)
        : reducersV1.setSymbolHide(state.v1, action),
    setPreviousDiagramAttributes: (state: PlanSheetsState, action: PayloadAction<PreviousDiagramAttributes>) =>
      state.stateVersion === "V2"
        ? reducersV2.setPreviousDiagramAttributes(state.v2, action)
        : reducersV1.setPreviousDiagramAttributes(state.v1, action),
    setLineHide: (state: PlanSheetsState, action: PayloadAction<{ id: string; hide: boolean }>) =>
      state.stateVersion === "V2" ? reducersV2.setLineHide(state.v2, action) : reducersV1.setLineHide(state.v1, action),
    setCopiedElements: (
      state: PlanSheetsState,
      action: PayloadAction<{ ids: number[]; type: string; action: "COPY" | "CUT"; pageId: number }>,
    ) =>
      state.stateVersion === "V2"
        ? reducersV2.setCopiedElements(state.v2, action)
        : reducersV1.setCopiedElements(state.v1, action),
    removePageLines: (state: PlanSheetsState, action: PayloadAction<{ lineIds: string[] }>) =>
      state.stateVersion === "V2"
        ? reducersV2.removePageLines(state.v2, action)
        : reducersV1.removePageLines(state.v1, action),
    removePageLabels: (state: PlanSheetsState, action: PayloadAction<{ labelIds: number[] }>) =>
      state.stateVersion === "V2"
        ? reducersV2.removePageLabels(state.v2, action)
        : reducersV1.removePageLabels(state.v1, action),
    undo: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? reducersV2.undo(state.v2) : reducersV1.undo(state.v1),
    clearUndo: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? reducersV2.clearUndo(state.v2) : reducersV1.clearUndo(state.v1),
    setCanViewHiddenLabels: (state: PlanSheetsState, action: PayloadAction<boolean>) =>
      state.stateVersion === "V2"
        ? reducersV2.setCanViewHiddenLabels(state.v2, action)
        : reducersV1.setCanViewHiddenLabels(state.v1, action),
    navigateAfterSave: (state: PlanSheetsState, action: PayloadAction<string | undefined>) =>
      state.stateVersion === "V2"
        ? reducersV2.navigateAfterSave(state.v2, action)
        : reducersV1.navigateAfterSave(state.v1, action),
    setViewableLabelTypes: (state: PlanSheetsState, action: PayloadAction<string[]>) =>
      state.stateVersion === "V2"
        ? reducersV2.setViewableLabelTypes(state.v2, action)
        : reducersV1.setViewableLabelTypes(state.v1, action),
    updateMaxElemIds: (state: PlanSheetsState, action: PayloadAction<{ element: string; maxId: number }>) =>
      state.stateVersion === "V2"
        ? reducersV2.updateMaxElemIds(state.v2, action)
        : reducersV1.updateMaxElemIds(state.v1, action),
    recoverAutoSave: (state: PlanSheetsState, action: PayloadAction<UserEdit>) => {
      // set data as usual
      planSheetsSlice.caseReducers.setPlanData(state, action);
      if (state.stateVersion === "V1") {
        // but mark as changed
        state.v1.hasChanges = true;
        state.v1.lastChangedAt = action.payload.lastChangedAt;
      } else if (state.stateVersion === "V2") {
        state.v2.current.hasChanges = true;
        state.v2.current.lastChangedAt = action.payload.lastChangedAt;
      }
    },
    convertToV2: (state: PlanSheetsState) => {
      console.log("CONVERTING TO V2");
      if (state.stateVersion === "V1") {
        state.v2 = {
          current: state.v1,
          past: state.v1,
        };
        state.stateVersion = "V2";
      }
    },
  },
  selectors: {
    getPlanData: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.getPlanData(state.v2) : selectorsV1.getPlanData(state.v1),
    getDiagrams: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.getDiagrams(state.v2) : selectorsV1.getDiagrams(state.v1),
    getPages: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.getPages(state.v2) : selectorsV1.getPages(state.v1),
    getConfigs: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.getConfigs(state.v2) : selectorsV1.getConfigs(state.v1),
    getLastModifiedAt: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.getLastModifiedAt(state.v2) : selectorsV1.getLastModifiedAt(state.v1),
    getActiveSheet: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.getActiveSheet(state.v2) : selectorsV1.getActiveSheet(state.v1),
    getPageConfigs: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.getPageConfigs(state.v2) : selectorsV1.getPageConfigs(state.v1),
    getElementTypeConfigs: (state: PlanSheetsState) =>
      state.stateVersion === "V2"
        ? selectorsV2.getElementTypeConfigs(state.v2)
        : selectorsV1.getElementTypeConfigs(state.v1),
    getMaxElemIds: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.getMaxElemIds(state.v2) : selectorsV1.getMaxElemIds(state.v1),
    getPageNumberFromPageRef: (state: PlanSheetsState) =>
      state.stateVersion === "V2"
        ? selectorsV2.getPageNumberFromPageRef(state.v2)
        : selectorsV1.getPageNumberFromPageRef(state.v1),
    getActivePageRefFromPageNumber: (state: PlanSheetsState) =>
      state.stateVersion === "V2"
        ? selectorsV2.getActivePageRefFromPageNumber(state.v2)
        : selectorsV1.getActivePageRefFromPageNumber(state.v1),
    getPageByRef: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.getPageByRef(state.v2) : selectorsV1.getPageByRef(state.v1),
    getPageRefFromPageNumber: (state: PlanSheetsState) =>
      state.stateVersion === "V2"
        ? selectorsV2.getPageRefFromPageNumber(state.v2)
        : selectorsV1.getPageRefFromPageNumber(state.v1),
    getActivePages: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.getActivePages(state.v2) : selectorsV1.getActivePages(state.v1),
    getActivePage: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.getActivePage(state.v2) : selectorsV1.getActivePage(state.v1),
    getActivePageNumber: (state: PlanSheetsState) =>
      state.stateVersion === "V2"
        ? selectorsV2.getActivePageNumber(state.v2)
        : selectorsV1.getActivePageNumber(state.v1),
    getCopiedElements: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.getCopiedElements(state.v2) : selectorsV1.getCopiedElements(state.v1),
    getFilteredPages: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.getFilteredPages(state.v2) : selectorsV1.getFilteredPages(state.v1),
    getOriginalPositions: (state: PlanSheetsState) =>
      state.stateVersion === "V2"
        ? selectorsV2.getOriginalPositions(state.v2)
        : selectorsV1.getOriginalPositions(state.v1),
    hasChanges: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.hasChanges(state.v2) : selectorsV1.hasChanges(state.v1),
    getLastChangedAt: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.getLastChangedAt(state.v2) : selectorsV1.getLastChangedAt(state.v1),
    getPlanMode: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.getPlanMode(state.v2) : selectorsV1.getPlanMode(state.v1),
    getSelectedElementIds: (state: PlanSheetsState) =>
      state.stateVersion === "V2"
        ? selectorsV2.getSelectedElementIds(state.v2)
        : selectorsV1.getSelectedElementIds(state.v1),
    getLastUpdatedLineStyle: (state: PlanSheetsState) =>
      state.stateVersion === "V2"
        ? selectorsV2.getLastUpdatedLineStyle(state.v2)
        : selectorsV1.getLastUpdatedLineStyle(state.v1),
    getLastUpdatedLabelStyle: (state: PlanSheetsState) =>
      state.stateVersion === "V2"
        ? selectorsV2.getLastUpdatedLabelStyle(state.v2)
        : selectorsV1.getLastUpdatedLabelStyle(state.v1),
    getAlignedLabelNodeId: (state: PlanSheetsState) =>
      state.stateVersion === "V2"
        ? selectorsV2.getAlignedLabelNodeId(state.v2)
        : selectorsV1.getAlignedLabelNodeId(state.v1),
    getElementsToMove: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.getElementsToMove(state.v2) : selectorsV1.getElementsToMove(state.v1),
    getPreviousAttributesForDiagram: (state: PlanSheetsState) =>
      state.stateVersion === "V2"
        ? selectorsV2.getPreviousAttributesForDiagram(state.v2)
        : selectorsV1.getPreviousAttributesForDiagram(state.v1),
    canUndo: (state: PlanSheetsState) =>
      state.stateVersion === "V2" ? selectorsV2.canUndo(state.v2) : selectorsV1.canUndo(state.v1),
    getCanViewHiddenLabels: (state: PlanSheetsState) =>
      state.stateVersion === "V2"
        ? selectorsV2.getCanViewHiddenLabels(state.v2)
        : selectorsV1.getCanViewHiddenLabels(state.v1),
    hasNavigateAfterSave: (state: PlanSheetsState) =>
      state.stateVersion === "V2"
        ? selectorsV2.hasNavigateAfterSave(state.v2)
        : selectorsV1.hasNavigateAfterSave(state.v1),
    getViewableLabelTypes: (state: PlanSheetsState) =>
      state.stateVersion === "V2"
        ? selectorsV2.getViewableLabelTypes(state.v2)
        : selectorsV1.getViewableLabelTypes(state.v1),
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
  setElementsToMove,
  setSelectedElementIds,
  setSymbolHide,
  setCopiedElements,
  setPreviousDiagramAttributes,
  setLineHide,
  setLabelsPageRef,
  removePageLines,
  removePageLabels,
  undo,
  clearUndo,
  setCanViewHiddenLabels,
  navigateAfterSave,
  setViewableLabelTypes,
  updateMaxElemIds,
  convertToV2,
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
  getElementsToMove,
  getPreviousAttributesForDiagram,
  canUndo,
  getCanViewHiddenLabels,
  hasNavigateAfterSave,
  getViewableLabelTypes,
} = planSheetsSlice.selectors;

export default planSheetsSlice;
