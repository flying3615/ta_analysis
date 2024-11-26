import { DiagramDTO, LabelDTOLabelTypeEnum, PageDTO } from "@linz/survey-plan-generation-api-client";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { generatePath, Route } from "react-router-dom";

import { CytoscapeCoordinateMapper } from "@/components/CytoscapeCanvas/CytoscapeCoordinateMapper";
import { nestedSurveyPlan, nestedTitlePlan } from "@/components/PlanSheets/__tests__/data/plansheetDiagramData";
import { DiagramList } from "@/components/PlanSheets/DiagramList";
import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { defaultOptionalVisibileLabelTypes } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { PlanSheetsDispatch } from "@/hooks/usePlanSheetsDispatch";
import { Paths } from "@/Paths";
import { PlanSheetsState } from "@/redux/planSheets/planSheetsSlice";
import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils";

const mockCytoscapeCoordinateMapper = new CytoscapeCoordinateMapper(
  { clientWidth: 400, clientHeight: 300 } as unknown as HTMLElement,
  [],
);

jest.mock("@/hooks/usePlanSheetsDispatch", () => {
  return {
    usePlanSheetsDispatch: jest.fn(
      () =>
        ({
          cyto: {
            on: jest.fn(),
            off: jest.fn(),
            add: jest.fn(),
            boxSelectionEnabled: jest.fn(),
            userPanningEnabled: jest.fn(),
          },
          cytoCanvas: {},
          cytoCoordMapper: mockCytoscapeCoordinateMapper,
          cytoDataToNodeAndEdgeData: jest.fn(),
          updateActiveDiagramsAndPage: jest.fn(),
        }) as unknown as PlanSheetsDispatch,
    ),
  };
});

describe("The Diagram list tree", () => {
  it("displays all title diagram labels correctly", () => {
    const titleDiagramList = nestedTitlePlan.diagrams;
    renderCompWithReduxAndRoute(
      <Route element={<DiagramList diagrams={titleDiagramList} />} path={Paths.layoutPlanSheets} />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
    );
    const allLabelsForDiagrams: string[] = titleDiagramList
      .flatMap((m) => m.labels.filter((l) => l.labelType === LabelDTOLabelTypeEnum.diagram))
      .map((l) => l.displayText);
    // check that a label has been found for all diagrams
    expect(allLabelsForDiagrams).toHaveLength(titleDiagramList.length);
    for (const diagramLabel of allLabelsForDiagrams) {
      expect(screen.getByText(diagramLabel)).toBeInTheDocument();
    }

    const orderedDiagramNames = screen.queryAllByText(/Diag/).map((elem) => elem.textContent);
    expect(orderedDiagramNames).toEqual([
      "System Generated Primary Diagram",
      "System Generated Non Primary Diagram",
      "Diag. A",
      "Diag. AA",
      "Diag. AAA",
      "Diag. AAAA",
      "Diag. AB",
      "Diag. ABA",
      "Diag. ABAA",
      "Diag. ABAAA",
      "Diag. AC",
      "Diag. ACA",
      "Diag. AD",
    ]);
  });

  it("displays all survey diagram labels correctly", () => {
    const surveyDiagramList = nestedSurveyPlan.diagrams;
    renderCompWithReduxAndRoute(
      <Route element={<DiagramList diagrams={surveyDiagramList} />} path={Paths.layoutPlanSheets} />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
    );
    const allLabelsForDiagrams: string[] = surveyDiagramList
      .flatMap((m) => m.labels.filter((l) => l.labelType === LabelDTOLabelTypeEnum.diagram))
      .map((l) => l.displayText);
    // check that a label has been found for all diagrams
    expect(allLabelsForDiagrams).toHaveLength(surveyDiagramList.length);
    for (const diagramLabel of allLabelsForDiagrams) {
      expect(screen.getByText(diagramLabel)).toBeInTheDocument();
    }

    const orderedDiagramNames = screen.queryAllByText(/Diag/).map((elem) => elem.textContent);
    expect(orderedDiagramNames).toEqual(["System Generated Traverse Diagram", "Diag. A", "Diag. AA"]);
  });
});

describe("Insert a diagram onto the plansheet", () => {
  const page1 = { id: 1, pageNumber: 1, pageType: PlanSheetType.TITLE } as PageDTO;
  const diagramSeven = {
    id: 7,
    pageRef: 1,
    originPageOffset: { x: 0.015, y: -0.015 },
    zoomScale: 500,
    bottomRightPoint: { x: 6.31, y: -2.32 },
    labels: [],
    coordinateLabels: [],
    parcelLabelGroups: [],
  } as unknown as DiagramDTO;
  const initialState: PlanSheetsState = {
    diagrams: [diagramSeven],
    pages: [page1],
    hasChanges: false,
    configs: [],
    activeSheet: PlanSheetType.TITLE,
    activePageNumbers: {
      [PlanSheetType.TITLE]: 1,
      [PlanSheetType.SURVEY]: 0,
    },
    planMode: PlanMode.View,
    previousDiagramAttributesMap: {},
    previousDiagrams: null,
    previousPages: null,
    canViewHiddenLabels: true,
    viewableLabelTypes: defaultOptionalVisibileLabelTypes,
  };

  it("Inserting a diagram is resized to the minimum size", async () => {
    const surveyDiagramList = nestedSurveyPlan.diagrams;
    const { store } = renderCompWithReduxAndRoute(
      <Route element={<DiagramList diagrams={surveyDiagramList} />} path={Paths.layoutPlanSheets} />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
      {
        preloadedState: {
          planSheets: initialState,
        },
      },
    );
    expect(store.getState().planSheets.diagrams[0]?.zoomScale).toBe(500);
    await userEvent.click(screen.getByText("Diag. AA"));
    await userEvent.click(screen.getByText("Insert diagram"));
    expect(store.getState().planSheets.diagrams[0]?.zoomScale).toBe(0.3);
  });
});
