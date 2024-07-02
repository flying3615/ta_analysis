import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface PlanSheetsState {
  activeSheet: PlanSheetType;
}

const initialState: PlanSheetsState = {
  activeSheet: PlanSheetType.TITLE,
};

const planSheetsSlice = createSlice({
  name: "planSheets",
  initialState,
  reducers: {
    setActiveSheet: (state, action: PayloadAction<PlanSheetType>) => {
      state.activeSheet = action.payload;
    },
  },
  selectors: {
    getActiveSheet: (state) => state.activeSheet,
    getActiveDiagramType: (state) => {
      const SheetToDiagramMap: Record<PlanSheetType, string> = {
        [PlanSheetType.SURVEY]: "sysGenTraverseDiag",
        [PlanSheetType.TITLE]: "sysGenPrimaryDiag",
      };
      return SheetToDiagramMap[state.activeSheet];
    },
  },
});

export const { setActiveSheet } = planSheetsSlice.actions;

export const { getActiveSheet, getActiveDiagramType } = planSheetsSlice.selectors;

export default planSheetsSlice;
