import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { DiagramSelector } from "@/components/PlanSheets/DiagramSelector.tsx";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { PlanDataBuilder } from "@/mocks/builders/PlanDataBuilder.ts";
import { server } from "@/mocks/mockServer.ts";
import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils.tsx";

describe("Diagram Selector panel", () => {
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
      <DiagramSelector />,
      "/plan-generation/layout-plan-sheets/123",
      "/plan-generation/layout-plan-sheets/:transactionId",
      {
        preloadedState: {
          planSheets: {
            activeSheet: PlanSheetType.SURVEY,
          },
        },
      },
    );

    expect(await screen.findByText("Survey sheet diagrams")).toBeInTheDocument();
  });

  it("Displays the title heading when title sheet is selected", async () => {
    renderCompWithReduxAndRoute(
      <DiagramSelector />,
      "/plan-generation/layout-plan-sheets/123",
      "/plan-generation/layout-plan-sheets/:transactionId",
      {
        preloadedState: {
          planSheets: {
            activeSheet: PlanSheetType.TITLE,
          },
        },
      },
    );
    expect(await screen.findByText("Title sheet diagrams")).toBeInTheDocument();
  });
});
