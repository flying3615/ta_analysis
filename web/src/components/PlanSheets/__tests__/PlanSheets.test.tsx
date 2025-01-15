import { MockUserContextProvider } from "@linz/lol-auth-js/mocks";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { cloneDeep } from "lodash-es";
import { delay, http, HttpResponse } from "msw";
import { generatePath, Route } from "react-router-dom";

import LandingPage from "@/components/LandingPage/LandingPage";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { PlanMode, PlanSheetType } from "@/components/PlanSheets/PlanSheetType";
import { defaultOptionalVisibileLabelTypes } from "@/components/PlanSheets/properties/LabelPropertiesUtils";
import { AsyncTaskBuilder } from "@/mocks/builders/AsyncTaskBuilder";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { singleFirmUserExtsurv1 } from "@/mocks/data/mockUsers";
import { server } from "@/mocks/mockServer";
import { Paths } from "@/Paths";
import { PlanSheetsState } from "@/redux/planSheets/planSheetsSlice";
import { setMockedSplitFeatures } from "@/setupTests";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags";
import { renderCompWithReduxAndRoute } from "@/test-utils/jest-utils";

import { nestedTitlePlan } from "./data/plansheetDiagramData";

const renderWithState = (state: PlanSheetsState) => {
  renderCompWithReduxAndRoute(
    <Route
      element={
        <MockUserContextProvider
          user={singleFirmUserExtsurv1}
          initialSelectedFirmId={singleFirmUserExtsurv1.firms[0]?.id}
        >
          <PlanSheets />
        </MockUserContextProvider>
      }
      path={Paths.layoutPlanSheets}
    />,
    generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
    { preloadedState: { planSheets: cloneDeep(state) } },
  );
};

const planSheetsState: PlanSheetsState = {
  diagrams: [],
  activeSheet: PlanSheetType.TITLE,
  pages: [
    { pageType: PlanSheetType.TITLE, id: 0, pageNumber: 1 },
    { pageType: PlanSheetType.TITLE, id: 1, pageNumber: 2 },
  ],
  activePageNumbers: {
    [PlanSheetType.TITLE]: 1,
    [PlanSheetType.SURVEY]: 0,
  },
  hasChanges: false,
  planMode: PlanMode.View,
  previousDiagramAttributesMap: {},
  previousDiagrams: null,
  previousPages: null,
  canViewHiddenLabels: true,
  viewableLabelTypes: defaultOptionalVisibileLabelTypes,
};

const mockGetPlanResponse = {
  ...nestedTitlePlan,
  diagrams: [
    { ...nestedTitlePlan.diagrams[0], pageRef: 1 },
    { ...nestedTitlePlan.diagrams[7], pageRef: 2 },
    { ...nestedTitlePlan.diagrams[8], pageRef: 4 },
    { ...nestedTitlePlan.diagrams[9], pageRef: 3 },
    { ...nestedTitlePlan.diagrams[11], pageRef: 5 },
  ],
  pages: [
    { id: 1, pageType: "title", pageNumber: 1 },
    { id: 2, pageType: "title", pageNumber: 2 },
    { id: 3, pageType: "title", pageNumber: 3 },
    { id: 4, pageType: "title", pageNumber: 4 },
    { id: 5, pageType: "title", pageNumber: 5 },
  ],
};

const renderWithFailedPlanRegen = () => {
  server.use(
    http.post(/\/124\/plan-regenerate$/, () =>
      HttpResponse.json(new AsyncTaskBuilder().build(), { status: 202, statusText: "ACCEPTED" }),
    ),
    http.get(/\/124\/async-task/, () =>
      HttpResponse.json(new AsyncTaskBuilder().withFailedStatus("SomeException", "Failed").build(), {
        status: 200,
        statusText: "OK",
      }),
    ),
  );

  renderCompWithReduxAndRoute(
    <Route element={<PlanSheets />} path={Paths.layoutPlanSheets} />,
    generatePath(Paths.layoutPlanSheets, { transactionId: "124" }),
  );
};

describe("PlanSheets", () => {
  it("renders with the survey sheet diagrams side panel open by default", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<PlanSheets />} path={Paths.layoutPlanSheets} />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
    );

    expect(await screen.findByText("Title sheet diagrams")).toBeVisible();
    const diagramsSidePanelButton = screen.getByTitle("Toggle diagrams panel");
    expect(diagramsSidePanelButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("diagrams-sidepanel")).toHaveAttribute("aria-hidden", "false");
  });

  it("closes the title sheet diagrams when toggle button is pressed", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<PlanSheets />} path={Paths.layoutPlanSheets} />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
    );

    expect(await screen.findByText("Title sheet diagrams")).toBeVisible();
    expect(screen.getByTestId("diagrams-sidepanel")).toHaveAttribute("aria-hidden", "false");

    const diagramsSidePanelButton = screen.getByTitle("Toggle diagrams panel");
    expect(diagramsSidePanelButton).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(diagramsSidePanelButton);

    expect(await screen.findByTitle("Toggle diagrams panel")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("diagrams-sidepanel")).toHaveAttribute("aria-hidden", "true");
  });

  it("displays error when survey not found", async () => {
    renderCompWithReduxAndRoute(
      <Route element={<PlanSheets />} path={Paths.layoutPlanSheets} />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "404" }),
    );

    expect(await screen.findByText("Survey not found")).toBeInTheDocument();
  });

  it("displays dialog when renumber button is pressed and validates inputs", async () => {
    renderWithState(planSheetsState);
    await waitFor(async () => {
      const renumberButton = screen.getByRole("button", { description: /Renumber page/i });
      expect(renumberButton).toBeInTheDocument();
      await userEvent.click(renumberButton);
    });

    await waitFor(() => {
      const modal = screen.getByRole("dialog");
      expect(modal).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Enter page number");
    const inputValues = { valid: 2, warning: 1, invalid: 100 };
    fireEvent.change(input, { target: { value: inputValues.invalid } });
    expect(screen.getByText("Enter a number between 1 and 2")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: inputValues.warning } });
    expect(screen.getByText("Diagram is already on page 1")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: inputValues.valid } });
    expect(screen.queryByText("Diagram is already on page 1")).not.toBeInTheDocument();
  });

  it("reorders pages correctly (page 1 to 5)", async () => {
    const mockState: PlanSheetsState = {
      diagrams: [],
      activeSheet: PlanSheetType.TITLE,
      pages: [],
      activePageNumbers: {
        [PlanSheetType.TITLE]: 1,
        [PlanSheetType.SURVEY]: 0,
      },
      hasChanges: false,
      planMode: PlanMode.View,
      previousDiagramAttributesMap: {},
      previousDiagrams: null,
      previousPages: null,
      canViewHiddenLabels: true,
      viewableLabelTypes: defaultOptionalVisibileLabelTypes,
    };

    server.use(
      http.get(/\/123\/plan$/, () => {
        return HttpResponse.json(mockGetPlanResponse, { status: 200, statusText: "OK" });
      }),
    );

    renderWithState(mockState);

    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });

    const renumberPageButton = screen.getByRole("button", { description: /Renumber page/i });
    await waitFor(() => {
      expect(renumberPageButton).toBeInTheDocument();
    });

    const diagramsAndPagesBefore = screen.queryAllByRole("presentation").map((elem) => elem.textContent);
    expect(diagramsAndPagesBefore).toStrictEqual([
      "System Generated Primary DiagramT1",
      "T1",
      "System Generated Non Primary DiagramT2",
      "T2",
      "Diag. AT3",
      "T3",
      "Diag. AAT4",
      "T4",
      "Diag. AAAT5",
      "T5",
    ]);

    await userEvent.click(renumberPageButton);
    await userEvent.type(screen.getByPlaceholderText("Enter page number"), "5");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    const diagramsAndPagesAfter = screen.queryAllByRole("presentation").map((elem) => elem.textContent);

    expect(diagramsAndPagesAfter).toStrictEqual([
      "System Generated Primary DiagramT5",
      "T5",
      "System Generated Non Primary DiagramT1",
      "T1",
      "Diag. AT2",
      "T2",
      "Diag. AAT3",
      "T3",
      "Diag. AAAT4",
      "T4",
    ]);
  });

  it("reorders pages correctly (page 4 to 2)", async () => {
    const mockState: PlanSheetsState = {
      diagrams: [],
      activeSheet: PlanSheetType.TITLE,
      pages: [],
      activePageNumbers: {
        [PlanSheetType.TITLE]: 4,
        [PlanSheetType.SURVEY]: 0,
      },
      hasChanges: false,
      planMode: PlanMode.View,
      previousDiagramAttributesMap: {},
      previousDiagrams: null,
      previousPages: null,
      canViewHiddenLabels: true,
      viewableLabelTypes: defaultOptionalVisibileLabelTypes,
    };

    server.use(
      http.get(/\/123\/plan$/, () => {
        return HttpResponse.json(mockGetPlanResponse, { status: 200, statusText: "OK" });
      }),
    );

    renderWithState(mockState);

    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });

    const renumberPageButton = screen.getByRole("button", { description: /Renumber page/i });
    await waitFor(() => {
      expect(renumberPageButton).toBeInTheDocument();
    });

    const diagramsAndPagesBefore = screen.queryAllByRole("presentation").map((elem) => elem.textContent);
    expect(diagramsAndPagesBefore).toStrictEqual([
      "System Generated Primary DiagramT1",
      "T1",
      "System Generated Non Primary DiagramT2",
      "T2",
      "Diag. AT3",
      "T3",
      "Diag. AAT4",
      "T4",
      "Diag. AAAT5",
      "T5",
    ]);

    await userEvent.click(renumberPageButton);
    await userEvent.type(screen.getByPlaceholderText("Enter page number"), "2");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    const diagramsAndPagesAfter = screen.queryAllByRole("presentation").map((elem) => elem.textContent);

    expect(diagramsAndPagesAfter).toStrictEqual([
      "System Generated Primary DiagramT1",
      "T1",
      "System Generated Non Primary DiagramT3",
      "T3",
      "Diag. AT4",
      "T4",
      "Diag. AAT2",
      "T2",
      "Diag. AAAT5",
      "T5",
    ]);
  });

  it("removes page correctly", async () => {
    const mockState = {
      ...planSheetsState,
      activePageNumbers: {
        [PlanSheetType.TITLE]: 3,
        [PlanSheetType.SURVEY]: 0,
      },
    };

    server.use(
      http.get(/\/123\/plan$/, () => {
        return HttpResponse.json(mockGetPlanResponse, { status: 200, statusText: "OK" });
      }),
    );

    renderWithState(mockState);

    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });

    const deletePageButton = screen.getByRole("button", { description: /Delete page/i });
    await waitFor(() => {
      expect(deletePageButton).toBeInTheDocument();
    });

    const diagramsAndPagesBefore = screen.queryAllByRole("presentation").map((elem) => elem.textContent);
    expect(diagramsAndPagesBefore).toStrictEqual([
      "System Generated Primary DiagramT1",
      "T1",
      "System Generated Non Primary DiagramT2",
      "T2",
      "Diag. AT3",
      "T3",
      "Diag. AAT4",
      "T4",
      "Diag. AAAT5",
      "T5",
    ]);

    await userEvent.click(deletePageButton);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /delete page\?/i })).toBeInTheDocument();
    });
    await userEvent.click(
      screen.queryAllByRole("button", { name: "Delete" }).find((elem) => elem.textContent === "Delete") as HTMLElement,
    );

    const diagramsAndPagesAfter = screen.queryAllByRole("presentation").map((elem) => elem.textContent);

    expect(diagramsAndPagesAfter).toStrictEqual([
      "System Generated Primary DiagramT1",
      "T1",
      "System Generated Non Primary DiagramT2",
      "T2",
      "Diag. A",
      "Diag. AAT3",
      "T3",
      "Diag. AAAT4",
      "T4",
    ]);
  });

  it("navigate back to landing page when clicked on dismiss button on error dialog", async () => {
    renderCompWithReduxAndRoute(
      <>
        <Route element={<PlanSheets />} path={Paths.layoutPlanSheets} />
        <Route element={<LandingPage />} path={Paths.root} />
      </>,
      generatePath(Paths.layoutPlanSheets, { transactionId: "404" }),
    );

    expect(await screen.findByText("Survey not found")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Dismiss"));
    expect(await screen.findByRole("heading", { name: "Plan generation" })).toBeInTheDocument();
  });

  it("displays loading spinner while waiting for response", () => {
    // response handler with delayed response
    server.use(
      http.get(/\/plan\/123$/, async () => {
        await delay(2000);
        return HttpResponse.json(mockPlanData, { status: 200, statusText: "OK" });
      }),
    );

    renderCompWithReduxAndRoute(
      <Route element={<PlanSheets />} path={Paths.layoutPlanSheets} />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "123" }),
    );

    // await new Promise((resolve) => setTimeout(resolve, 3000)); // uncomment to make test fail

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("CytoscapeCanvas")).not.toBeInTheDocument();
  });

  it("regenerates plan asynchronously and allows retrying if it fails", async () => {
    const requestSpy = jest.fn();
    server.events.on("request:start", requestSpy);

    renderWithFailedPlanRegen();

    expect(await screen.findByText(/Failed to regenerate plan/)).not.toBeNull();
    expect(await screen.findByText(/Retry, or call us on/)).not.toBeNull();
    expect(await screen.findByText(/if it continues failing./)).not.toBeNull();
    const retryButton = await screen.findByText("Retry");
    expect(retryButton).not.toBeNull();

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "POST",
          url: expect.stringMatching(/\/124\/plan-regenerate$/) as unknown,
        }) as unknown,
      }),
    );
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: expect.stringMatching(/\/124\/async-task/) as unknown,
        }) as unknown,
      }),
    );

    requestSpy.mockReset();
    server.use(
      http.get(/\/124\/async-task/, () =>
        HttpResponse.json(new AsyncTaskBuilder().withCompleteStatus().build(), { status: 200, statusText: "OK" }),
      ),
    );
    await userEvent.click(retryButton);

    expect(await screen.findByText("Title sheet diagrams")).toBeVisible();
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "POST",
          url: expect.stringMatching(/\/124\/plan-regenerate$/) as unknown,
        }) as unknown,
      }),
    );
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: expect.stringMatching(/\/124\/async-task/) as unknown,
        }) as unknown,
      }),
    );
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: expect.stringMatching(/\/124\/plan$/) as unknown,
        }) as unknown,
      }),
    );
  }, 20000);

  it("regenerates plan asynchronously with no extended error info if toggled off", async () => {
    const requestSpy = jest.fn();
    server.events.on("request:start", requestSpy);
    setMockedSplitFeatures({ [FEATUREFLAGS.SURVEY_PLAN_GENERATION_BACKGROUND_ERRORS]: "off" });

    renderWithFailedPlanRegen();

    expect(await screen.findByText(/Failed to regenerate plan/)).not.toBeNull();
    expect(screen.queryByText(/Detailed error information/)).toBeNull();
  });

  it("regenerates plan asynchronously with extended error info if toggled on", async () => {
    const requestSpy = jest.fn();
    server.events.on("request:start", requestSpy);
    setMockedSplitFeatures({ [FEATUREFLAGS.SURVEY_PLAN_GENERATION_BACKGROUND_ERRORS]: "on" });

    renderWithFailedPlanRegen();

    expect(await screen.findByText(/Failed to regenerate plan/)).not.toBeNull();
    expect(screen.getByText(/Detailed error information/)).toBeInTheDocument();
  });

  it("regenerates plan asynchronously and allows retrying when interrupted by deployment", async () => {
    const requestSpy = jest.fn();
    server.events.on("request:start", requestSpy);

    server.use(
      http.post(/\/124\/plan-regenerate$/, () =>
        HttpResponse.json(new AsyncTaskBuilder().build(), { status: 202, statusText: "ACCEPTED" }),
      ),
      http.get(/\/124\/async-task/, () =>
        HttpResponse.json(new AsyncTaskBuilder().withInterruptedStatus().build(), { status: 200, statusText: "OK" }),
      ),
    );

    renderCompWithReduxAndRoute(
      <Route element={<PlanSheets />} path={Paths.layoutPlanSheets} />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "124" }),
    );

    expect(await screen.findByText(/Plan regeneration interrupted/)).not.toBeNull();
    const retryButton = await screen.findByText("Retry");
    expect(retryButton).not.toBeNull();

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "POST",
          url: expect.stringMatching(/\/124\/plan-regenerate$/) as unknown,
        }) as unknown,
      }),
    );
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: expect.stringMatching(/\/124\/async-task/) as unknown,
        }) as unknown,
      }),
    );

    requestSpy.mockReset();
    server.use(
      http.get(/\/124\/async-task/, () =>
        HttpResponse.json(new AsyncTaskBuilder().withCompleteStatus().build(), { status: 200, statusText: "OK" }),
      ),
    );
    await userEvent.click(retryButton);

    expect(await screen.findByText("Title sheet diagrams")).toBeVisible();
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "POST",
          url: expect.stringMatching(/\/124\/plan-regenerate$/) as unknown,
        }) as unknown,
      }),
    );
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: expect.stringMatching(/\/124\/async-task/) as unknown,
        }) as unknown,
      }),
    );
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: expect.stringMatching(/\/124\/plan$/) as unknown,
        }) as unknown,
      }),
    );
  }, 20000);

  it("shows message while regenerate plan task is already in progress", async () => {
    server.use(
      http.post(/\/124\/plan-regenerate$/, () =>
        HttpResponse.json(new AsyncTaskBuilder().build(), { status: 200, statusText: "OK" }),
      ),
      http.get(/\/124\/async-task/, () =>
        HttpResponse.json(new AsyncTaskBuilder().withInProgressStatus().build(), { status: 200, statusText: "OK" }),
      ),
    );
    renderCompWithReduxAndRoute(
      <Route element={<PlanSheets />} path={Paths.layoutPlanSheets} />,
      generatePath(Paths.layoutPlanSheets, { transactionId: "124" }),
    );
    expect(await screen.findByText(/Preparing survey and diagrams for Layout Plan Sheets/)).toBeVisible();
    expect(await screen.findByText(/This may take a few moments\.\.\./)).toBeVisible();
  });
});
