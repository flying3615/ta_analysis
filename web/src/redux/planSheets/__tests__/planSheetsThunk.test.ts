import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder";
import { setupStore } from "@/redux/store";

import { PlanSheetsState } from "../planSheetsSlice";
import { populateLookupTblAsync } from "../planSheetsThunk";

describe("populateLookupTblAsync", () => {
  it("should update lookup table from diagrams and pages", async () => {
    const { diagrams, pages } = new PlanDataBuilder()
      .addDiagram({
        bottomRightPoint: {
          x: 80,
          y: -90,
        },
        diagramType: "sysGenPrimaryDiag",
        id: 11,
        pageRef: 4,
      })
      .addDiagram({
        bottomRightPoint: {
          x: 80,
          y: -90,
        },
        diagramType: "sysGenTraverseDiag",
        id: 12,
        pageRef: 5,
      })
      .addDiagram({
        bottomRightPoint: {
          x: 80,
          y: -90,
        },
        diagramType: "userDefnPrimaryDiag",
        id: 13,
        pageRef: 6,
      })
      .addPage({ id: 4, pageNumber: 1, pageType: PlanSheetType.TITLE })
      .addPage({ id: 5, pageNumber: 1, pageType: PlanSheetType.SURVEY })
      .addPage({ id: 6, pageNumber: 2, pageType: PlanSheetType.SURVEY })
      .build();

    const mockState: PlanSheetsState = {
      diagrams: diagrams,
      pages: pages,
      activeSheet: PlanSheetType.TITLE,
      activePageNumbers: {
        [PlanSheetType.TITLE]: 1,
        [PlanSheetType.SURVEY]: 1,
      },
      hasChanges: false,
    };

    const expectedResult = {
      "11": { pageRef: 4, page: { id: 4, pageNumber: 1, pageType: "title" } },
      "12": { pageRef: 5, page: { id: 5, pageNumber: 1, pageType: "survey" } },
      "13": { pageRef: 6, page: { id: 6, pageNumber: 2, pageType: "survey" } },
    };

    const store = setupStore({ planSheets: mockState });

    const action = await store.dispatch(populateLookupTblAsync());
    expect(action.payload).toEqual(expectedResult);

    const diagPageLookupTbl = store.getState().planSheets.diagPageLookupTbl;
    expect(diagPageLookupTbl).toEqual(expectedResult);
  });
});
