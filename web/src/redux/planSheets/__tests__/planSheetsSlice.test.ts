import { PageDTOPageTypeEnum } from "@linz/survey-plan-generation-api-client";

import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder";
import { selectActiveDiagrams } from "@/modules/plan/selectGraphData";
import { setupStore } from "@/redux/store";

import planSheetsSlice, {
  getActivePage,
  getActivePageNumber,
  getActivePages,
  getActiveSheet,
  getDiagrams,
  getFilteredPages,
  getPageConfigs,
  getPages,
  getPlanData,
  getPlanMode,
  hasChanges,
  PlanSheetsState,
  replaceDiagrams,
  setActivePageNumber,
  setActiveSheet,
  setLineHide,
  setPlanData,
  setSymbolHide,
  updatePages,
} from "../planSheetsSlice";

describe("planSheetsSlice", () => {
  const initialState: PlanSheetsState = {
    configs: [],
    diagrams: [],
    pages: [],
    activeSheet: PlanSheetType.TITLE,
    activePageNumbers: {
      [PlanSheetType.TITLE]: 1,
      [PlanSheetType.SURVEY]: 1,
    },
    hasChanges: false,
    planMode: PlanMode.View,
    previousDiagramAttributesMap: {},
  };

  let store = setupStore();

  const emptyDiagramsBuilder = () =>
    new PlanDataBuilder()
      .addConfigs()
      .addDiagram({
        bottomRightPoint: {
          x: 80,
          y: -90,
        },
        diagramType: "sysGenPrimaryDiag",
        pageRef: 1,
      })
      .addDiagram({
        bottomRightPoint: {
          x: 80,
          y: -90,
        },
        diagramType: "sysGenTraverseDiag",
        pageRef: 2,
      })
      .addDiagram({
        bottomRightPoint: {
          x: 80,
          y: -90,
        },
        diagramType: "userDefnPrimaryDiag",
        pageRef: 3,
      })
      .addPage({ id: 1, pageNumber: 1, pageType: PlanSheetType.TITLE })
      .addPage({ id: 2, pageNumber: 1, pageType: PlanSheetType.SURVEY })
      .addPage({ id: 3, pageNumber: 2, pageType: PlanSheetType.SURVEY });
  const { configs, diagrams, pages } = emptyDiagramsBuilder().build();

  beforeEach(() => {
    store = setupStore({ planSheets: initialState });
  });

  test("getActiveSheet should return active sheet", () => {
    expect(getActiveSheet(store.getState())).toBe(PlanSheetType.TITLE);

    store.dispatch(setActiveSheet(PlanSheetType.SURVEY));
    expect(getActiveSheet(store.getState())).toBe(PlanSheetType.SURVEY);
  });

  test("getActivePages should return active pages", () => {
    const pages = [
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
    ];

    expect(getActivePages(store.getState())).toEqual([]);

    store.dispatch(planSheetsSlice.actions.updatePages(pages));
    expect(getActivePages(store.getState())).toEqual([{ id: 0, pageNumber: 1, pageType: "title" }]);
  });

  test("getActivePage should return active page", () => {
    const pages = [
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
    ];

    expect(getActivePage(store.getState())).toBeUndefined();

    store.dispatch(planSheetsSlice.actions.updatePages(pages));
    expect(getActivePage(store.getState())).toEqual({ id: 0, pageNumber: 1, pageType: "title" });
  });

  test("getActivePageNumber should return active page number", () => {
    expect(getActivePageNumber(store.getState())).toBe(1);

    store.dispatch(
      setActivePageNumber({
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
            id: 1,
            pageNumber: 1,
          },
          {
            pageType: PlanSheetType.SURVEY,
            id: 2,
            pageNumber: 1,
          },
          {
            pageType: PlanSheetType.SURVEY,
            id: 3,
            pageNumber: 2,
          },
        ],
      },
    });
    expect(getFilteredPages(store.getState())).toEqual({ totalPages: 1 });
  });

  test("selectActiveDiagrams should return active diagrams on current page", () => {
    store = setupStore({
      planSheets: {
        ...initialState,
        diagrams,
        pages,
      },
    });

    let activeDiagrams = selectActiveDiagrams(store.getState());
    expect(activeDiagrams).toHaveLength(1);
    expect(activeDiagrams[0]?.id).toBe(1);
    expect(activeDiagrams[0]?.diagramType).toBe("sysGenPrimaryDiag");

    store.dispatch(setActiveSheet(PlanSheetType.SURVEY));
    activeDiagrams = selectActiveDiagrams(store.getState());
    expect(activeDiagrams).toHaveLength(1);
    expect(activeDiagrams[0]?.id).toBe(2);
    expect(activeDiagrams[0]?.diagramType).toBe("sysGenTraverseDiag");
  });

  test("selectActiveDiagrams should return active diagrams when page changed", () => {
    store = setupStore({
      planSheets: {
        ...initialState,
        diagrams,
        pages,
      },
    });

    store.dispatch(setActiveSheet(PlanSheetType.SURVEY));
    store.dispatch(setActivePageNumber({ pageType: PlanSheetType.SURVEY, pageNumber: 2 }));
    const activeDiagrams = selectActiveDiagrams(store.getState());
    expect(activeDiagrams).toHaveLength(1);
    expect(activeDiagrams[0]?.id).toBe(3);
    expect(activeDiagrams[0]?.diagramType).toBe("userDefnPrimaryDiag");
  });

  test("setPlanData should set diagram and page data", () => {
    store = setupStore({
      planSheets: {
        ...initialState,
        hasChanges: true,
      },
    });
    expect(getPlanData(store.getState())).toStrictEqual({ diagrams: [], pages: [] });
    expect(hasChanges(store.getState())).toBe(true);

    store.dispatch(setPlanData({ configs, diagrams, pages }));
    expect(getPageConfigs(store.getState())).toStrictEqual(configs[0]?.pageConfigs);
    expect(getPlanData(store.getState())).toStrictEqual({ diagrams, pages });
    expect(getDiagrams(store.getState())).toStrictEqual(diagrams);
    expect(getPages(store.getState())).toStrictEqual(pages);
    expect(hasChanges(store.getState())).toBe(false);
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
    expect(hasChanges(store.getState())).toBe(false);

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

    store.dispatch(replaceDiagrams(replacementDiagrams));

    expect(getPlanData(store.getState()).diagrams[0]?.bottomRightPoint).toStrictEqual({ x: 10, y: -10 });
    expect(getPlanData(store.getState()).diagrams[1]?.bottomRightPoint).toStrictEqual({ x: 80, y: -90 });
    expect(hasChanges(store.getState())).toBe(true);
  });

  test("updatePages should alter pages state and set hasChanges", () => {
    store = setupStore({
      planSheets: {
        ...initialState,
        diagrams,
      },
    });

    expect(hasChanges(store.getState())).toBe(false);

    const replacementPages = [
      {
        id: 2,
        pageType: PageDTOPageTypeEnum.title,
        pageNumber: 2,
      },
    ];

    store.dispatch(updatePages(replacementPages));

    expect(getPlanData(store.getState()).pages[0]?.id).toBe(2);
    expect(hasChanges(store.getState())).toBe(true);
  });

  test("hasChanges should return if there are changes", () => {
    expect(hasChanges(store.getState())).toBe(false);

    store = setupStore({ planSheets: { ...initialState, hasChanges: true } });
    expect(hasChanges(store.getState())).toBe(true);
  });

  test("planMode should contain current plan mode", () => {
    expect(getPlanMode(store.getState())).toBe(PlanMode.View);

    store = setupStore({ planSheets: { ...initialState, planMode: PlanMode.SelectDiagram } });
    expect(getPlanMode(store.getState())).toBe(PlanMode.SelectDiagram);
  });

  test("setSymbolHide should set the displayState on the coordinate in store", () => {
    const diagramsWithMark = emptyDiagramsBuilder()
      .addCooordinate(101, { x: 20, y: -10 })
      .addSymbolLabel(1011, "*", { x: 20, y: -10 })
      .build().diagrams;
    store = setupStore({
      planSheets: {
        ...initialState,
        diagrams: diagramsWithMark,
      },
    });
    expect(store.getState().planSheets.diagrams[2]?.coordinateLabels[0]?.displayState).toBe("display");

    store.dispatch(setSymbolHide({ id: "1011", hide: true }));

    expect(store.getState().planSheets.diagrams[2]?.coordinateLabels[0]?.displayState).toBe("hide");
  });

  test("setLineHide should set the displayState on the line in store", () => {
    const diagramsWithLine = emptyDiagramsBuilder()
      .addCooordinate(101, { x: 20, y: -10 })
      .addCooordinate(101, { x: 25, y: -10 })
      .addCooordinate(103, { x: 15, y: -10 })
      .addLine(1011, [101, 102, 103])
      .build().diagrams;
    store = setupStore({
      planSheets: {
        ...initialState,
        diagrams: diagramsWithLine,
      },
    });
    expect(store.getState().planSheets.diagrams[2]?.lines[0]?.displayState).toBeUndefined(); // default to visible

    store.dispatch(setLineHide({ id: "1011", hide: true }));

    expect(store.getState().planSheets.diagrams[2]?.lines[0]?.displayState).toBe("hide");
  });
});
