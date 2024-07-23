import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";

import LandingPage from "@/components/LandingPage/LandingPage.tsx";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { server } from "@/mocks/mockServer";
import { renderCompWithReduxAndRoute, renderMultiCompWithReduxAndRoute } from "@/test-utils/jest-utils.tsx";

import PlanSheets from "../PlanSheets";

describe("PlanSheets", () => {
  it("renders with the survey sheet diagrams side panel open by default", async () => {
    renderCompWithReduxAndRoute(
      <PlanSheets />,
      "/plan-generation/layout-plan-sheets/123",
      "/plan-generation/layout-plan-sheets/:transactionId",
    );

    expect(await screen.findByText("Title sheet diagrams")).toBeVisible();
    const diagramsSidePanelButton = screen.getByTitle("Toggle diagrams panel");
    expect(diagramsSidePanelButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("diagrams-sidepanel")).toHaveAttribute("aria-hidden", "false");
  });

  it("closes the title sheet diagrams when toggle button is pressed", async () => {
    renderCompWithReduxAndRoute(
      <PlanSheets />,
      "/plan-generation/layout-plan-sheets/123",
      "/plan-generation/layout-plan-sheets/:transactionId",
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
      <PlanSheets />,
      "/plan-generation/layout-plan-sheets/404",
      "/plan-generation/layout-plan-sheets/:transactionId",
    );

    expect(await screen.findByText("Unexpected error")).toBeInTheDocument();
  });

  it("navigate back to landing page when clicked on dismiss button on error dialog", async () => {
    renderMultiCompWithReduxAndRoute("/plan-generation/layout-plan-sheets/404", [
      { component: <PlanSheets />, route: "/plan-generation/layout-plan-sheets/:transactionId" },
      { component: <LandingPage />, route: "/plan-generation/:transactionId" },
    ]);

    expect(await screen.findByText("Unexpected error")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Dismiss"));
    expect(await screen.findByRole("heading", { name: "Plan generation" })).toBeInTheDocument();
  });

  it("displays loading spinner while waiting for response", async () => {
    // response handler with delayed response
    server.use(
      http.get(/\/plan\/123$/, async () => {
        await delay(2000);
        return HttpResponse.json(mockPlanData, { status: 200, statusText: "OK" });
      }),
    );

    renderCompWithReduxAndRoute(
      <PlanSheets />,
      "/plan-generation/layout-plan-sheets/123",
      "/plan-generation/layout-plan-sheets/:transactionId",
    );
    // await new Promise((resolve) => setTimeout(resolve, 3000)); // uncomment to make test fail

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("CytoscapeCanvas")).not.toBeInTheDocument();
  });

  it("regenerates plan and displays message when refreshRequired", async () => {
    const requestSpy = jest.fn();
    server.events.on("request:start", requestSpy);

    renderCompWithReduxAndRoute(
      <PlanSheets />,
      "/plan-generation/layout-plan-sheets/124",
      "/plan-generation/layout-plan-sheets/:transactionId",
    );

    expect(await screen.findByText(/Preparing survey and diagrams for Layout Plan Sheets/)).toBeVisible();
    expect(await screen.findByText(/This may take a few moments\.\.\./)).toBeVisible();
    // then
    expect(await screen.findByText("Title sheet diagrams")).toBeVisible();

    expect(requestSpy).toHaveBeenCalledTimes(4);
    expect(requestSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: "http://localhost/api/v1/generate-plans/plan/check/124",
        }),
      }),
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        request: expect.objectContaining({
          method: "POST",
          url: "http://localhost/api/v1/generate-plans/plan/124",
        }),
      }),
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        request: expect.objectContaining({
          method: "GET",
          url: "http://localhost/api/v1/generate-plans/plan/124",
        }),
      }),
    );
  });

  it("displays error when regenerate fails", async () => {
    server.use(
      http.post(/\/plan\/124$/, async () => {
        return HttpResponse.json(
          { ok: false, statusCode: 20001, message: "prepare dataset application error" },
          { status: 200, statusText: "OK" },
        );
      }),
    );

    renderCompWithReduxAndRoute(
      <PlanSheets />,
      "/plan-generation/layout-plan-sheets/124",
      "/plan-generation/layout-plan-sheets/:transactionId",
    );

    expect(await screen.findByText(/prepare dataset application error/)).not.toBeNull();
  });
});
