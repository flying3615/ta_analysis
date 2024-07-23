import { LuiMessagingContextProvider } from "@linzjs/lui";
import { LuiModalAsyncContextProvider } from "@linzjs/windows";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";

import { diagrams } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { server } from "@/mocks/mockServer.ts";
import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils.tsx";

import PlanSheetsFooter from "../PlanSheetsFooter.tsx";

describe("PlanSheetsFooter", () => {
  const planSheetsState = {
    diagrams: [],
    pages: [],
    activeSheet: PlanSheetType.TITLE,
  };

  it("renders", async () => {
    renderCompWithReduxAndRoute(
      <PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={true} />,
      "/plan-generation/layout-plan-sheets/123",
      "/plan-generation/layout-plan-sheets/:transactionId",
    );

    expect(await screen.findByTitle("Toggle diagrams panel")).toBeInTheDocument();
  });

  it("displays menu with Title sheet selected", async () => {
    renderCompWithReduxAndRoute(
      <PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={true} />,
      "/plan-generation/layout-plan-sheets/123",
      "/plan-generation/layout-plan-sheets/:transactionId",
      {
        preloadedState: {
          planSheets: {
            ...planSheetsState,
            activeSheet: PlanSheetType.TITLE,
          },
        },
      },
    );

    expect(screen.queryByRole("menuitem")).toBeNull();

    await userEvent.click(screen.getByRole("button", { description: /Change sheet view/ }));

    expect(screen.getByText("Change sheet view")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Title sheet/ })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("menuitem", { name: /Survey sheet/ })).not.toHaveAttribute("aria-disabled");
  });

  it("displays menu with Survey sheet selected", async () => {
    renderCompWithReduxAndRoute(
      <PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={true} />,
      "/plan-generation/layout-plan-sheets/123",
      "/plan-generation/layout-plan-sheets/:transactionId",
      {
        preloadedState: {
          planSheets: {
            ...planSheetsState,
            activeSheet: PlanSheetType.SURVEY,
          },
        },
      },
    );

    expect(screen.queryByRole("menuitem")).toBeNull();

    await userEvent.click(screen.getByRole("button", { description: /Change sheet view/ }));

    expect(screen.getByText("Change sheet view")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Title sheet/ })).not.toHaveAttribute("aria-disabled");
    expect(screen.getByRole("menuitem", { name: /Survey sheet/ })).toHaveAttribute("aria-disabled", "true");
  });

  it("successful save results in showing toast message", async () => {
    const requestSpy = jest.fn();
    server.events.on("request:start", requestSpy);

    server.use(http.put(/\/plan\/123$/, () => HttpResponse.text(null, { status: 200 })));

    renderCompWithReduxAndRoute(
      <LuiMessagingContextProvider version="v2">
        <PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={false} />
      </LuiMessagingContextProvider>,
      "/plan-generation/layout-plan-sheets/123",
      "/plan-generation/layout-plan-sheets/:transactionId",
      {
        preloadedState: {
          planSheets: {
            ...planSheetsState,
            diagrams,
          },
        },
      },
    );

    await userEvent.click(await screen.findByText("Save layout"));

    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "PUT",
          url: "http://localhost/api/v1/generate-plans/plan/123",
          _bodyText: JSON.stringify({
            diagrams: [
              {
                id: 1,
                originPageOffset: { x: 0, y: 0 },
                bottomRightPoint: { x: 1500, y: -1000 },
                diagramType: "sysGenPrimaryDiag",
                coordinates: [],
                lines: [],
                labels: [],
                parcelLabels: [],
                coordinateLabels: [],
                lineLabels: [],
              },
            ],
            pages: [],
          }),
        }),
      }),
    );

    const successToast = await screen.findByText("Layout saved successfully");
    expect(successToast).toBeVisible();
    expect(successToast).toHaveClass("LuiBannerV2");
    expect(successToast).toHaveClass("success");

    expect(screen.queryByTestId("update-plan-loading-spinner")).not.toBeInTheDocument();
  });

  it("pressing save button results in loading state", async () => {
    const requestSpy = jest.fn();
    server.events.on("request:start", requestSpy);

    server.use(
      http.put(/\/plan\/123$/, async () => {
        delay(20000);
        HttpResponse.text(null, { status: 200 });
      }),
    );

    renderCompWithReduxAndRoute(
      <PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={false} />,
      "/plan-generation/layout-plan-sheets/123",
      "/plan-generation/layout-plan-sheets/:transactionId",
    );

    expect(screen.queryByTestId("update-plan-loading-spinner")).not.toBeInTheDocument();
    await userEvent.click(await screen.findByText("Save layout"));

    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "PUT",
          url: "http://localhost/api/v1/generate-plans/plan/123",
        }),
      }),
    );

    expect(await screen.findByTestId("update-plan-loading-spinner")).toBeInTheDocument();
  });

  it("failing to save results in showing an error message", async () => {
    const requestSpy = jest.fn();
    server.events.on("request:start", requestSpy);

    server.use(http.put(/\/plan\/123$/, () => HttpResponse.text(null, { status: 500 })));

    renderCompWithReduxAndRoute(
      <LuiModalAsyncContextProvider>
        <PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={false} />
      </LuiModalAsyncContextProvider>,
      "/plan-generation/layout-plan-sheets/123",
      "/plan-generation/layout-plan-sheets/:transactionId",
    );

    jest.spyOn(console, "error").mockImplementation(jest.fn());
    await userEvent.click(await screen.findByText("Save layout"));

    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "PUT",
          url: "http://localhost/api/v1/generate-plans/plan/123",
        }),
      }),
    );

    expect(await screen.findByText("Unexpected error")).toBeInTheDocument();
    expect(screen.queryByText("Layout saved successfully")).not.toBeInTheDocument();
    expect(screen.queryByTestId("update-plan-loading-spinner")).not.toBeInTheDocument();
  });

  it("can save by pressing the Ctrl+S keys", async () => {
    const requestSpy = jest.fn();
    server.events.on("request:start", requestSpy);

    server.use(http.put(/\/plan\/123$/, () => HttpResponse.text(null, { status: 200 })));

    renderCompWithReduxAndRoute(
      <LuiMessagingContextProvider version="v2">
        <PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={false} />
      </LuiMessagingContextProvider>,
      "/plan-generation/layout-plan-sheets/123",
      "/plan-generation/layout-plan-sheets/:transactionId",
      {
        preloadedState: {
          planSheets: {
            ...planSheetsState,
            diagrams,
          },
        },
      },
    );

    const element = await screen.findByText("Save layout");
    fireEvent.keyDown(element, { key: "s", ctrlKey: true });

    expect(await screen.findByText("Layout saved successfully")).toBeVisible();
    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "PUT",
          url: "http://localhost/api/v1/generate-plans/plan/123",
        }),
      }),
    );
  });
});
