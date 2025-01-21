import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { PlanSheetsState } from "@/redux/planSheets/planSheetsSlice";
import { PlanSheetsStateV1 } from "@/redux/planSheets/planSheetsSliceUtils";

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
