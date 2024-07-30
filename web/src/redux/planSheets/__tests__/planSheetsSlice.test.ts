import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder";
import { setupStore } from "@/redux/store";

import planSheetsSlice, {
  getActiveDiagrams,
  getActivePageNumber,
  getActiveSheet,
  getDiagrams,
  getFilteredPages,
  getPages,
  getPlanData,
  PlanSheetsState,
} from "../planSheetsSlice";

describe("planSheetsSlice", () => {
  const initialState: PlanSheetsState = {
    diagrams: [],
    pages: [],
    activeSheet: PlanSheetType.TITLE,
    activePageNumbers: {
      [PlanSheetType.TITLE]: 0,
      [PlanSheetType.SURVEY]: 0,
    },
  };

  let store = setupStore();

  const diagrams = new PlanDataBuilder()
    .addDiagram(
      {
        x: 80,
        y: -90,
      },
      undefined,
      "sysGenPrimaryDiag",
    )
    .addDiagram(
      {
        x: 80,
        y: -90,
      },
      undefined,
      "sysGenTraverseDiag",
    )
    .build().diagrams;

  beforeEach(() => {
    store = setupStore({ planSheets: initialState });
  });

  test("getActiveSheet should return active sheet", () => {
    expect(getActiveSheet(store.getState())).toBe(PlanSheetType.TITLE);

    store.dispatch(planSheetsSlice.actions.setActiveSheet(PlanSheetType.SURVEY));
    expect(getActiveSheet(store.getState())).toBe(PlanSheetType.SURVEY);
  });

  test("getActivePageNumber should return active page number", () => {
    expect(getActivePageNumber(store.getState())).toBe(0);

    store.dispatch(
      planSheetsSlice.actions.setActivePageNumber({
        pageType: PlanSheetType.TITLE,
        pageNumber: 2,
      }),
    );
    expect(getActivePageNumber(store.getState())).toBe(2);
  });

  test("getFilteredPages should return filtered pages", () => {
    store = setupStore({
      planSheets: {
        ...initialState,
        pages: [
          {
            pageType: PlanSheetType.TITLE,
            id: 0,
            pageNumber: 1,
          },
          {
            pageType: PlanSheetType.SURVEY,
            id: 1,
            pageNumber: 2,
          },
        ],
      },
    });
    expect(getFilteredPages(store.getState())).toEqual({ totalPages: 1 });
  });

  test("getActiveDiagrams should return active diagrams", () => {
    store = setupStore({
      planSheets: {
        ...initialState,
        diagrams,
      },
    });

    let activeDiagrams = getActiveDiagrams(store.getState());
    expect(activeDiagrams).toHaveLength(1);
    expect(activeDiagrams[0]?.id).toBe(1);
    expect(activeDiagrams[0]?.diagramType).toBe("sysGenPrimaryDiag");

    store.dispatch(planSheetsSlice.actions.setActiveSheet(PlanSheetType.SURVEY));
    activeDiagrams = getActiveDiagrams(store.getState());
    expect(activeDiagrams).toHaveLength(1);
    expect(activeDiagrams[0]?.id).toBe(2);
    expect(activeDiagrams[0]?.diagramType).toBe("sysGenTraverseDiag");
  });

  test("setPlanData should set diagram and page data", () => {
    expect(getPlanData(store.getState())).toStrictEqual({ diagrams: [], pages: [] });

    store.dispatch(planSheetsSlice.actions.setPlanData({ diagrams, pages: [] }));
    expect(getPlanData(store.getState())).toStrictEqual({ diagrams, pages: [] });
    expect(getDiagrams(store.getState())).toStrictEqual(diagrams);
    expect(getPages(store.getState())).toStrictEqual([]);
  });

  test("replaceDiagrams should replace diagram data", () => {
    store = setupStore({
      planSheets: {
        ...initialState,
        diagrams,
      },
    });

    expect(getPlanData(store.getState())).toStrictEqual({ diagrams, pages: [] });
    expect(getPlanData(store.getState()).diagrams[0]?.bottomRightPoint).toStrictEqual({ x: 80, y: -90 });
    expect(getPlanData(store.getState()).diagrams[1]?.bottomRightPoint).toStrictEqual({ x: 80, y: -90 });

    const replacementDiagrams = new PlanDataBuilder()
      .addDiagram(
        {
          x: 10,
          y: -10,
        },
        undefined,
        "sysGenPrimaryDiag",
      )
      .build().diagrams;

    store.dispatch(planSheetsSlice.actions.replaceDiagrams(replacementDiagrams));

    expect(getPlanData(store.getState()).diagrams[0]?.bottomRightPoint).toStrictEqual({ x: 10, y: -10 });
    expect(getPlanData(store.getState()).diagrams[1]?.bottomRightPoint).toStrictEqual({ x: 80, y: -90 });
  });
});
