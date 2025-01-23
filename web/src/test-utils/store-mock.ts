import { DiagramDTO, PageDTO } from "@linz/survey-plan-generation-api-client";

import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { PlanSheetsState } from "@/redux/planSheets/planSheetsSlice";
import { PlanSheetsStateV1, PlanSheetsStateV2, State } from "@/redux/planSheets/planSheetsSliceUtils";

const state = {
  diagrams: [],
  pages: [{ id: 0, pageNumber: 1, pageType: PlanSheetType.TITLE }],
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
  canViewHiddenLabels: true,
  viewableLabelTypes: [],
  selectedElementIds: [],
};

const initialStateV1: PlanSheetsState = {
  v1: state,
  v2: { current: state, past: state },
  stateVersion: "V1",
};

export const mockStoreV1 = {
  planSheets: initialStateV1,
};

export const modifiedStateV1 = (state: Partial<PlanSheetsStateV1>): PlanSheetsState => ({
  ...initialStateV1,
  v1: { ...initialStateV1.v1, ...state },
});

export const modifiedStateV2 = (state: Partial<PlanSheetsStateV2>): PlanSheetsState => ({
  ...initialStateV1,
  v2: { ...initialStateV1.v2, ...state },
  stateVersion: "V2",
});

export const modifiedCurrentStateV2 = (state: Partial<State>): PlanSheetsState => ({
  ...initialStateV1,
  v2: { ...initialStateV1.v2, current: { ...initialStateV1.v2.current, ...state } },
  stateVersion: "V2",
});

export const modifiedPastStateV2 = (state: Partial<State>): PlanSheetsState => ({
  ...initialStateV1,
  v2: { ...initialStateV1.v2, past: { ...initialStateV1.v2.past, ...state } },
  stateVersion: "V2",
});

type ModifiedStateV1 = { state: Partial<PlanSheetsStateV1>; stateVersion: "V1" };
type ModifiedStateV2 = { state: Partial<PlanSheetsStateV2>; stateVersion: "V2" };

export const modifiedState = (newState: Partial<State>, stateVersion: "V1" | "V2"): PlanSheetsState => {
  if (stateVersion === "V1") {
    return createState({ state: { ...state, ...newState }, stateVersion });
  } else {
    return createState({ state: { current: { ...state, ...newState } }, stateVersion });
  }
};

export const createState = ({ state, stateVersion }: ModifiedStateV1 | ModifiedStateV2): PlanSheetsState => {
  switch (stateVersion) {
    case "V1":
      return modifiedStateV1(state);
    case "V2":
      return modifiedStateV2(state);
  }
};

export const extractState = (state: PlanSheetsState, stateVersion: "V1" | "V2"): State => {
  switch (stateVersion) {
    case "V1":
      return state.v1;
    case "V2":
      return state.v2.current;
  }
};

export const extractPast = (
  state: PlanSheetsState,
  stateVersion: "V1" | "V2",
): {
  hasChanges?: boolean;
  diagrams: DiagramDTO[] | null;
  pages: PageDTO[] | null;
} => {
  switch (stateVersion) {
    case "V1":
      return {
        diagrams: state.v1.previousDiagrams,
        pages: state.v1.previousPages,
        hasChanges: state.v1.previousHasChanges,
      };
    case "V2":
      return {
        diagrams: state.v2.replayAction ? state.v2.past.diagrams : null, // Emulates how v1 previousDiagrams works when there is no undo
        pages: state.v2.replayAction ? state.v2.past.pages : null, // Emulates how v1 previousPages works when there is no undo
        hasChanges: state.v2.past.hasChanges,
      };
  }
};

export const stateVersions = [["V1"], ["V2"]] as const;
