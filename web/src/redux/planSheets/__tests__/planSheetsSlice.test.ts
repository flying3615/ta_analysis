import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { setupStore } from "@/redux/store";

import planSheetsSlice, { getActiveDiagramType, getActiveSheet, PlanSheetsState } from "../planSheetsSlice";

describe("planSheetsSlice", () => {
  const initialState: PlanSheetsState = {
    activeSheet: PlanSheetType.TITLE,
  };

  let store = setupStore();

  beforeEach(() => {
    store = setupStore({ planSheets: initialState });
  });

  test("getActiveSheet should return active sheet", () => {
    expect(getActiveSheet(store.getState())).toBe(PlanSheetType.TITLE);

    store.dispatch(planSheetsSlice.actions.setActiveSheet(PlanSheetType.SURVEY));
    expect(getActiveSheet(store.getState())).toBe(PlanSheetType.SURVEY);
  });

  test("getActiveDiagramType should return active diagram type", () => {
    expect(getActiveDiagramType(store.getState())).toBe("sysGenPrimaryDiag");

    store.dispatch(planSheetsSlice.actions.setActiveSheet(PlanSheetType.SURVEY));
    expect(getActiveDiagramType(store.getState())).toBe("sysGenTraverseDiag");
  });
});
