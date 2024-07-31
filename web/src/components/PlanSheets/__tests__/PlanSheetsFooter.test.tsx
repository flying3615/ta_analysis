import { LuiMessagingContextProvider } from "@linzjs/lui";
import { LuiModalAsyncContextProvider } from "@linzjs/windows";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { generatePath, Route } from "react-router-dom";

import { diagrams } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { server } from "@/mocks/mockServer.ts";
import { Paths } from "@/Paths.ts";
import { PlanSheetsState } from "@/redux/planSheets/planSheetsSlice.ts";
import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils.tsx";

import PlanSheetsFooter from "../PlanSheetsFooter.tsx";

describe("PlanSheetsFooter", () => {
  const planSheetsState = {
    diagrams: [],
    pages: [],
    activeSheet: PlanSheetType.TITLE,
    hasChanges: false,
  };

  const renderWithState = (state: PlanSheetsState) => {
    renderCompWithReduxAndRoute(
      <Route
        element={<PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={true} />}
        path={Paths.layoutPlanSheets}
      />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
      { preloadedState: { planSheets: state } },
    );
  };

  it("renders", async () => {
    renderCompWithReduxAndRoute(
      <Route
        element={<PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={true} />}
        path={Paths.layoutPlanSheets}
      />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
    );

    expect(await screen.findByTitle("Toggle diagrams panel")).toBeInTheDocument();
    expect(await screen.findByTitle("Change sheet view")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save layout/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /first/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /last/i })).toBeInTheDocument();
  });

  it("displays menu with Title sheet selected", async () => {
    renderCompWithReduxAndRoute(
      <Route
        element={<PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={true} />}
        path={Paths.layoutPlanSheets}
      />,
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
      <Route
        element={<PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={true} />}
        path={Paths.layoutPlanSheets}
      />,
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

    server.use(http.put(/\/123\/plan$/, () => HttpResponse.text(null, { status: 200 })));

    renderCompWithReduxAndRoute(
      <Route
        element={
          <LuiMessagingContextProvider version="v2">
            <PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={false} />
          </LuiMessagingContextProvider>
        }
        path={Paths.layoutPlanSheets}
      />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
      {
        preloadedState: {
          planSheets: {
            ...planSheetsState,
            diagrams,
            activePageNumbers: {
              [PlanSheetType.TITLE]: 0,
              [PlanSheetType.SURVEY]: 0,
            },
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
          url: "http://localhost/api/v1/generate-plans/123/plan",
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
                listOrder: 1,
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
      http.put(/\/123\/plan$/, async () => {
        delay(20000);
        HttpResponse.text(null, { status: 200 });
      }),
    );

    renderCompWithReduxAndRoute(
      <Route
        element={<PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={false} />}
        path={Paths.layoutPlanSheets}
      />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
    );

    expect(screen.queryByTestId("update-plan-loading-spinner")).not.toBeInTheDocument();
    await userEvent.click(await screen.findByText("Save layout"));

    // expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "PUT",
          url: "http://localhost/api/v1/generate-plans/123/plan",
        }),
      }),
    );

    expect(await screen.findByTestId("update-plan-loading-spinner")).toBeInTheDocument();
  });

  it("failing to save results in showing an error message", async () => {
    const requestSpy = jest.fn();
    server.events.on("request:start", requestSpy);

    server.use(http.put(/\/123\/plan$/, () => HttpResponse.text(null, { status: 500 })));

    renderCompWithReduxAndRoute(
      <Route
        element={
          <LuiModalAsyncContextProvider>
            <PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={false} />
          </LuiModalAsyncContextProvider>
        }
        path={Paths.layoutPlanSheets}
      />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
    );

    jest.spyOn(console, "error").mockImplementation(jest.fn());
    await userEvent.click(await screen.findByText("Save layout"));

    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "PUT",
          url: "http://localhost/api/v1/generate-plans/123/plan",
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

    server.use(http.put(/\/123\/plan$/, () => HttpResponse.text(null, { status: 200 })));

    renderCompWithReduxAndRoute(
      <Route
        element={
          <LuiMessagingContextProvider version="v2">
            <PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={false} />
          </LuiMessagingContextProvider>
        }
        path={Paths.layoutPlanSheets}
      />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
      {
        preloadedState: {
          planSheets: {
            ...planSheetsState,
            diagrams,
            activePageNumbers: {
              [PlanSheetType.TITLE]: 0,
              [PlanSheetType.SURVEY]: 0,
            },
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
          url: "http://localhost/api/v1/generate-plans/123/plan",
        }),
      }),
    );
  });

  it("displays the number of pages", async () => {
    renderWithState({
      ...planSheetsState,
      activeSheet: PlanSheetType.TITLE,
      pages: [
        {
          pageType: PlanSheetType.TITLE,
          id: 0,
          pageNumber: 1,
        },
        {
          pageType: PlanSheetType.TITLE,
          id: 1,
          pageNumber: 2,
        },
      ],
      activePageNumbers: {
        [PlanSheetType.TITLE]: 1,
        [PlanSheetType.SURVEY]: 0,
      },
    });
    const paginationElement = screen.getByText((content, element) => {
      return element?.textContent === "Page 1 of 2";
    });
    expect(paginationElement).toBeInTheDocument();
  });

  it("shows current page number and it's non-editable", async () => {
    renderWithState({
      ...planSheetsState,
      activeSheet: PlanSheetType.TITLE,
      pages: [
        {
          pageType: PlanSheetType.TITLE,
          id: 0,
          pageNumber: 1,
        },
        {
          pageType: PlanSheetType.TITLE,
          id: 1,
          pageNumber: 2,
        },
      ],
      activePageNumbers: {
        [PlanSheetType.TITLE]: 2,
        [PlanSheetType.SURVEY]: 0,
      },
    });

    const paginationElement = screen.getByText((content, element) => {
      return element?.textContent === "Page 2 of 2";
    });
    expect(paginationElement).toBeInTheDocument();
    expect(paginationElement).not.toHaveAttribute("contenteditable", "true");
  });

  it("disable appropriate navigation buttons when on the first page", async () => {
    renderWithState({
      ...planSheetsState,
      activeSheet: PlanSheetType.TITLE,
      pages: [
        {
          pageType: PlanSheetType.TITLE,
          id: 0,
          pageNumber: 1,
        },
        {
          pageType: PlanSheetType.TITLE,
          id: 1,
          pageNumber: 2,
        },
      ],
      activePageNumbers: {
        [PlanSheetType.TITLE]: 1,
        [PlanSheetType.SURVEY]: 0,
      },
    });

    expect(screen.getByRole("button", { name: /First/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Next/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Last/i })).toBeEnabled();
  });

  it("disable appropriate navigation buttons when on the last page", async () => {
    renderWithState({
      ...planSheetsState,
      activeSheet: PlanSheetType.TITLE,
      pages: [
        {
          pageType: PlanSheetType.TITLE,
          id: 0,
          pageNumber: 1,
        },
        {
          pageType: PlanSheetType.TITLE,
          id: 1,
          pageNumber: 2,
        },
      ],
      activePageNumbers: {
        [PlanSheetType.TITLE]: 2,
        [PlanSheetType.SURVEY]: 2,
      },
    });

    expect(screen.getByRole("button", { name: /First/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Previous/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Next/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Last/i })).toBeDisabled();
  });

  it("enable appropriate navigation buttons when on 3rd page out of 4 pages", async () => {
    renderWithState({
      ...planSheetsState,
      activeSheet: PlanSheetType.TITLE,
      pages: [
        {
          pageType: PlanSheetType.TITLE,
          id: 0,
          pageNumber: 1,
        },
        {
          pageType: PlanSheetType.TITLE,
          id: 1,
          pageNumber: 2,
        },
        {
          pageType: PlanSheetType.TITLE,
          id: 2,
          pageNumber: 3,
        },
        {
          pageType: PlanSheetType.TITLE,
          id: 3,
          pageNumber: 4,
        },
      ],
      activePageNumbers: {
        [PlanSheetType.TITLE]: 4,
        [PlanSheetType.SURVEY]: 2,
      },
    });
    await userEvent.click(await screen.findByRole("button", { name: /Previous/i }));
    const paginationElement = screen.getByText((content, element) => {
      return element?.textContent === "Page 3 of 4";
    });
    expect(paginationElement).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /First/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Previous/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Next/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Last/i })).toBeEnabled();
  });
});
