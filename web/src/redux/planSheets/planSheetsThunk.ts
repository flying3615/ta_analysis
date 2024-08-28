import { DiagramDTO, PageDTO } from "@linz/survey-plan-generation-api-client";
import { createAsyncThunk } from "@reduxjs/toolkit";

import { RootState } from "@/redux/store.ts";

export interface IDiagramToPage {
  [key: number]: {
    pageRef: number | undefined;
    page: PageDTO;
  };
}
// Async thunk to create the lookupTbl
export const populateLookupTblAsync = createAsyncThunk("planSheets/initLookupTblAsync", async (_, { getState }) => {
  const state = getState() as RootState;
  const { diagrams, pages } = state.planSheets;
  const createLookupTbl = (diagrams: DiagramDTO[], pages: PageDTO[]): IDiagramToPage => {
    const lookupTbl: IDiagramToPage = {};
    diagrams.forEach((diagram) => {
      const correspondingPage = pages.find((pageItem) => pageItem.id === diagram.pageRef);
      if (correspondingPage) {
        lookupTbl[diagram.id] = {
          pageRef: diagram.pageRef,
          page: correspondingPage,
        };
      }
    });
    return lookupTbl;
  };
  return createLookupTbl(diagrams, pages);
});
