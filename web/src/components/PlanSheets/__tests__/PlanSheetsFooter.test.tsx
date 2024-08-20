import { DisplayStateEnum } from "@linz/survey-plan-generation-api-client";
import { LuiMessagingContextProvider } from "@linzjs/lui";
import { LuiModalAsyncContextProvider } from "@linzjs/windows";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { generatePath, Link, Route } from "react-router-dom";

import { diagrams } from "@/components/CytoscapeCanvas/__tests__/mockDiagramData.ts";
import { PlanSheetType } from "@/components/PlanSheets/PlanSheetType.ts";
import { server } from "@/mocks/mockServer.ts";
import { Paths } from "@/Paths.ts";
import { PlanSheetsState } from "@/redux/planSheets/planSheetsSlice.ts";
import { setMockedSplitFeatures } from "@/setupTests.ts";
import { FEATUREFLAGS, TREATMENTS } from "@/split-functionality/FeatureFlags.ts";
import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils.tsx";

import PlanSheetsFooter from "../PlanSheetsFooter.tsx";

describe("PlanSheetsFooter", () => {
  const planSheetsState = {
    diagrams: [],
    pages: [],
    activeSheet: PlanSheetType.TITLE,
    activePageNumbers: {
      [PlanSheetType.TITLE]: 0,
      [PlanSheetType.SURVEY]: 0,
    },
    hasChanges: false,
  };

  const initStateForTwoPages = {
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
  };

  const setupAddPageTest = async (menuItemName: string | RegExp) => {
    renderWithState(initStateForTwoPages);
    await userEvent.click(screen.getByRole("button", { description: /Add page/ }));
    expect(screen.getByText("Add page")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: new RegExp(menuItemName, "i") })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("menuitem", { name: new RegExp(menuItemName, "i") }));
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
    expect(screen.getByRole("button", { description: /add page/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { description: /renumber page/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { description: /delete page/i })).toBeInTheDocument();
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
                zoomScale: 100,
                pageRef: 1,
                displayState: DisplayStateEnum.display,
                coordinates: [],
                lines: [],
                labels: [],
                parcelLabels: [],
                parcelLabelGroups: [],
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

  it("add page menu presents options (Add first page, last page, and page after current)", async () => {
    renderCompWithReduxAndRoute(
      <Route
        element={<PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={true} />}
        path={Paths.layoutPlanSheets}
      />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
    );

    fireEvent.click(await screen.findByTitle("Add page"));
    const addNewPageMenuItem = await screen.findByRole("menuitem", { name: "Add new last page" });
    // eslint-disable-next-line testing-library/no-node-access
    expect(addNewPageMenuItem.previousSibling?.textContent).toBe("Add page"); //assertion for Add page header in menu
    expect(await screen.findByRole("menuitem", { name: "Add new last page" })).toBeInTheDocument();
    expect(await screen.findByRole("menuitem", { name: "Add new page after this one" })).toBeInTheDocument();
    expect(await screen.findByRole("menuitem", { name: "Add new first page" })).toBeInTheDocument();
  });

  it("shows confirmation dialog and can leave without saving when attempting to navigate away with unsaved changes", async () => {
    const requestSpy = jest.fn();
    server.events.on("request:start", requestSpy);

    renderCompWithReduxAndRoute(
      <>
        <Route
          element={
            <>
              <Link to="/dummy">Navigate</Link>
              <PlanSheetsFooter diagramsPanelOpen={false} setDiagramsPanelOpen={jest.fn()} />
            </>
          }
          path={Paths.layoutPlanSheets}
        />
        <Route element={<span>Dummy Page</span>} path="/dummy" />
      </>,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
      {
        preloadedState: {
          planSheets: {
            ...planSheetsState,
            pages: [
              {
                id: 1,
                pageType: "survey",
                pageNumber: 1,
              },
              {
                id: 2,
                pageType: "survey",
                pageNumber: 2,
              },
              {
                id: 3,
                pageType: "title",
                pageNumber: 1,
              },
              {
                id: 4,
                pageType: "title",
                pageNumber: 2,
              },
            ],
            activeSheet: PlanSheetType.TITLE,
            activePageNumbers: {
              [PlanSheetType.TITLE]: 2,
              [PlanSheetType.SURVEY]: 2,
            },
            diagrams,
            hasChanges: true,
          },
        },
      },
    );

    expect(await screen.findByTitle("Add page")).toBeInTheDocument();
    const initialPages = await screen.findAllByTestId("lui-counter-number-rect");
    expect(initialPages).toHaveLength(2);

    fireEvent.click(await screen.findByTitle("Add page"));
    fireEvent.click(await screen.findByText("Add new page after this one"));
    const updatedPages = await screen.findAllByTestId("lui-counter-number-rect");
    expect(updatedPages[updatedPages.length - 1]).toHaveTextContent("3");

    expect(await screen.findByText("Save layout")).toBeInTheDocument();
    await userEvent.click(await screen.findByText("Navigate"));
    expect(await screen.findByText("You have unsaved changes")).toBeInTheDocument();
    expect(
      await screen.findByText(
        "If you navigate away from Layout Plan Sheets without saving, you will lose any unsaved changes",
      ),
    ).toBeInTheDocument();

    await userEvent.click(await screen.findByText("Cancel"));
    expect(screen.queryByText("Dummy Page")).not.toBeInTheDocument();

    await userEvent.click(await screen.findByText("Navigate"));
    await userEvent.click(await screen.findByText("Leave"));
    expect(await screen.findByText("Dummy Page")).toBeInTheDocument();
    expect(requestSpy).toHaveBeenCalledTimes(0);
  });

  it("shows confirmation dialog and can save and leave when attempting to navigate away with unsaved changes", async () => {
    const requestSpy = jest.fn();
    server.events.on("request:start", requestSpy);

    renderCompWithReduxAndRoute(
      <>
        <Route
          element={
            <>
              <Link to="/dummy">Navigate</Link>
              <PlanSheetsFooter diagramsPanelOpen={false} setDiagramsPanelOpen={jest.fn()} />
            </>
          }
          path={Paths.layoutPlanSheets}
        />
        <Route element={<span>Dummy Page</span>} path="/dummy" />
      </>,
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
            hasChanges: true,
          },
        },
      },
    );

    expect(await screen.findByText("Save layout")).toBeInTheDocument();
    await userEvent.click(await screen.findByText("Navigate"));
    expect(await screen.findByText("You have unsaved changes")).toBeInTheDocument();

    await userEvent.click(await screen.findByText("Save & leave"));

    expect(await screen.findByText("Layout saved successfully")).toBeVisible();
    expect(await screen.findByText("Dummy Page")).toBeInTheDocument();
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

  test("beforeunload event listener is added for unsaved changes", async () => {
    const addEventListenerSpy = jest.spyOn(window, "addEventListener");

    renderCompWithReduxAndRoute(
      <Route
        element={<PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={false} />}
        path={Paths.layoutPlanSheets}
      />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
    );
    expect(await screen.findByText("Save layout")).toBeInTheDocument();

    expect(addEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function), undefined);
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

  const addPagesPayload = [
    [
      "Add new last page",
      [
        { id: 0, pageType: "title", pageNumber: 1 },
        { id: 1, pageType: "title", pageNumber: 2 },
        { id: 2, pageType: "title", pageNumber: 3 },
      ],
    ],
    [
      "Add new page after this one",
      [
        { id: 0, pageType: "title", pageNumber: 1 },
        { id: 2, pageType: "title", pageNumber: 2 },
        { id: 1, pageType: "title", pageNumber: 3 },
      ],
    ],
    [
      "Add new first page",
      [
        { id: 2, pageType: "title", pageNumber: 1 },
        { id: 0, pageType: "title", pageNumber: 2 },
        { id: 1, pageType: "title", pageNumber: 3 },
      ],
    ],
  ];

  test.each(addPagesPayload)("validate correct page number order after->  %s", async (addPage, expected) => {
    const menuItemName = addPage as string;
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
          },
        },
      },
    );
    expect(await screen.findByText("Save layout")).toBeVisible();

    const paginationElement = screen.getByText((content, element) => {
      return element?.textContent === "Page 1 of 2";
    });
    expect(paginationElement).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { description: /Add page/ }));
    expect(screen.getByText("Add page")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: new RegExp(menuItemName, "i") })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("menuitem", { name: new RegExp(menuItemName, "i") }));

    await userEvent.click(await screen.findByText("Save layout"));
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "PUT",
          url: "http://localhost/api/v1/generate-plans/123/plan",
          _bodyText: JSON.stringify({
            diagrams: [],
            pages: expected,
          }),
        }),
      }),
    );
    expect(await screen.findByText("Layout saved successfully")).toBeInTheDocument();
  });

  const addPagesCount = [
    ["Add new last page", "Page 1 of 3"],
    ["Add new page after this one", "Page 1 of 3"],
    ["Add new first page", "Page 1 of 3"],
  ];
  test.each(addPagesCount)("validate page count after-> %s", async (pageString, expected) => {
    await setupAddPageTest(pageString);
    const paginationElement = screen.getByText((content, element) => {
      return element?.textContent === expected;
    });
    expect(paginationElement).toBeInTheDocument();
  });

  it("Show the save layout button as disabled when SURVEY_PLAN_GENERATION_SAVE_LAYOUT is off", () => {
    setMockedSplitFeatures({ [FEATUREFLAGS.SURVEY_PLAN_GENERATION_SAVE_LAYOUT]: TREATMENTS.OFF });
    renderCompWithReduxAndRoute(
      <Route
        element={<PlanSheetsFooter setDiagramsPanelOpen={jest.fn()} diagramsPanelOpen={true} />}
        path={Paths.layoutPlanSheets}
      />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
    );
    const saveButton = screen.getByRole("button", { name: /save layout/i });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });
});
