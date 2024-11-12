import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { generatePath, Route } from "react-router-dom";

import { nestedMiniTitlePlan } from "@/components/PlanSheets/__tests__/data/plansheetDiagramData";
import { DiagramSelector } from "@/components/PlanSheets/DiagramSelector";
import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder";
import { server } from "@/mocks/mockServer";
import { Paths } from "@/Paths";
import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils";

describe("Diagram Selector panel", () => {
  const planSheetsState = {
    diagrams: [],
    pages: [],
    hasChanges: false,
    planMode: PlanMode.View,
  };

  beforeAll(() => {
    const plan = new PlanDataBuilder()
      .addDiagram(
        {
          x: 80,
          y: -90,
        },
        undefined,
        "sysGenTraverseDiag",
      )
      .addCooordinate(10001, {
        x: 20,
        y: -10,
      })
      .addCooordinate(10002, {
        x: 50,
        y: -50,
      })
      .addCooordinate(10003, {
        x: 20,
        y: -60,
      })
      .addCooordinate(10004, {
        x: 10,
        y: -10,
      })
      .build();
    server.use(http.get(/\/plan\/123$/, () => HttpResponse.json(plan, { status: 200 })));
  });
  it("Displays the survey heading when survey sheet is selected", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<DiagramSelector />} path={Paths.layoutPlanSheets} />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
      {
        preloadedState: {
          planSheets: {
            ...planSheetsState,
            activeSheet: PlanSheetType.SURVEY,
            activePageNumbers: {
              [PlanSheetType.TITLE]: 0,
              [PlanSheetType.SURVEY]: 0,
            },
            previousDiagramAttributesMap: {},
            previousDiagrams: [],
            previousPages: [],
            canViewHiddenLabels: true,
          },
        },
      },
    );

    expect(await screen.findByText("Survey sheet diagrams")).toBeInTheDocument();
  });

  it("Displays the title heading when title sheet is selected", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<DiagramSelector />} path={Paths.layoutPlanSheets} />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
      {
        preloadedState: {
          planSheets: {
            ...planSheetsState,
            activeSheet: PlanSheetType.TITLE,
            activePageNumbers: {
              [PlanSheetType.TITLE]: 0,
              [PlanSheetType.SURVEY]: 0,
            },
            previousDiagramAttributesMap: {},
            previousDiagrams: [],
            previousPages: [],
            canViewHiddenLabels: true,
          },
        },
      },
    );

    expect(await screen.findByText("Title sheet diagrams")).toBeInTheDocument();
  });

  it("selects a diagram from diagram list and add that to a page", async () => {
    const titleDiagramList = nestedMiniTitlePlan.diagrams;
    const titlePageList = nestedMiniTitlePlan.pages;
    renderCompWithReduxAndRoute(
      <Route element={<DiagramSelector />} path={Paths.layoutPlanSheets} />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
      {
        preloadedState: {
          planSheets: {
            ...planSheetsState,
            diagrams: titleDiagramList,
            pages: titlePageList,
            activeSheet: PlanSheetType.TITLE,
            activePageNumbers: {
              [PlanSheetType.TITLE]: 2,
              [PlanSheetType.SURVEY]: 0,
            },
            previousDiagramAttributesMap: {},
            previousDiagrams: [],
            previousPages: [],
            canViewHiddenLabels: true,
          },
        },
      },
    );
    // We'll try to add diagram_id = 1 to page_number = 2 (which is empty)
    const diagramLabels = screen.getAllByRole("presentation", { name: "" });
    const firstDiagramLabel = diagramLabels[0];
    if (firstDiagramLabel) {
      await userEvent.click(firstDiagramLabel);
    } else {
      console.error("Second diagram label is undefined");
    }
    expect(firstDiagramLabel).toHaveClass("selected");
    expect(within(firstDiagramLabel!).getByText("Diagram 1")).not.toHaveClass("disabled");
    expect(within(firstDiagramLabel!).queryByText(/T2/i)).not.toBeInTheDocument();
    expect(within(firstDiagramLabel!).queryByRole("button", { name: "Remove from sheet" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Insert diagram/ })).toBeInTheDocument();

    await userEvent.click(await screen.findByRole("button", { name: /Insert diagram/ }));

    expect(within(firstDiagramLabel!).getByText("Diagram 1")).toHaveClass("disabled");
    expect(within(firstDiagramLabel!).getByRole("button", { name: "Remove from sheet" })).toBeInTheDocument();
  });

  it("removes a diagram from the page and the remove button disappears", async () => {
    const titleDiagramList = nestedMiniTitlePlan.diagrams;
    const titlePageList = nestedMiniTitlePlan.pages;
    renderCompWithReduxAndRoute(
      <Route element={<DiagramSelector />} path={Paths.layoutPlanSheets} />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
      {
        preloadedState: {
          planSheets: {
            ...planSheetsState,
            diagrams: titleDiagramList,
            pages: titlePageList,
            activeSheet: PlanSheetType.TITLE,
            activePageNumbers: {
              [PlanSheetType.TITLE]: 1,
              [PlanSheetType.SURVEY]: 0,
            },
            previousDiagramAttributesMap: {},
            previousDiagrams: [],
            previousPages: [],
            canViewHiddenLabels: true,
          },
        },
      },
    );
    expect(screen.getByRole("button", { name: /Remove from sheet/i })).toBeInTheDocument();
    expect(screen.getByText("T1")).toBeInTheDocument();

    await userEvent.click(await screen.findByRole("button", { name: /Remove from sheet/i }));

    expect(screen.queryByRole("button", { name: /Remove from sheet/i })).not.toBeInTheDocument();
    expect(screen.queryByText("T1")).not.toBeInTheDocument();
  });
});
