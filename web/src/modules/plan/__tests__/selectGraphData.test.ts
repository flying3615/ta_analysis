import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder";
import { PlanSheetsState } from "@/redux/planSheets/planSheetsSlice";
import { setupStore } from "@/redux/store";
import { modifiedState, stateVersions } from "@/test-utils/store-mock";

import { selectDiagramToPageLookupTable } from "../selectGraphData";

describe.each(stateVersions)("selectDiagramToPageLookupTable state%s", (version) => {
  it("should derive lookup table from diagrams and pages", () => {
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

    const mockState: PlanSheetsState = modifiedState(
      {
        diagrams: diagrams,
        pages: pages,
      },
      version,
    );

    const expectedResult = {
      "11": { pageRef: 4, page: { id: 4, pageNumber: 1, pageType: "title" } },
      "12": { pageRef: 5, page: { id: 5, pageNumber: 1, pageType: "survey" } },
      "13": { pageRef: 6, page: { id: 6, pageNumber: 2, pageType: "survey" } },
    };

    const store = setupStore({ planSheets: mockState });
    const diagPageLookupTbl = selectDiagramToPageLookupTable(store.getState());
    expect(diagPageLookupTbl).toEqual(expectedResult);
  });
});
