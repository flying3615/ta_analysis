import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";

export const mockStore = {
  planSheets: {
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
  },
};
