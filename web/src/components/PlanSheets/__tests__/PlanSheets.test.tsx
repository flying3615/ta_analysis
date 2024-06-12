import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import PlanSheets from "../PlanSheets";
import userEvent from "@testing-library/user-event";
import { server } from "@/mocks/mockServer";
import { mockPlanData } from "@/mocks/data/mockPlanData";
import { rest } from "msw";
import { renderCompWithReduxAndRoute, renderMultiCompWithReduxAndRoute } from "@/test-utils/jest-utils.tsx";
import LandingPage from "@/components/LandingPage/LandingPage.tsx";

describe("PlanSheets", () => {
  it("renders with the survey sheet diagrams side panel open by default", async () => {
    renderCompWithReduxAndRoute(
      <PlanSheets />,
      "/plan-generation/layout-plan-sheets/123",
      "/plan-generation/layout-plan-sheets/:transactionId",
    );

    expect(await screen.findByText("Sheets")).toBeInTheDocument();
    const diagramsSidePanelButton = screen.getByTitle("Toggle diagrams panel");
    expect(diagramsSidePanelButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("diagrams-sidepanel")).toHaveAttribute("aria-hidden", "false");
  });

  it("closes the survey sheet diagrams when toggle button is pressed", async () => {
    renderCompWithReduxAndRoute(
      <PlanSheets />,
      "/plan-generation/layout-plan-sheets/123",
      "/plan-generation/layout-plan-sheets/:transactionId",
    );

    expect(await screen.findByText("Survey sheet diagrams")).toBeVisible();
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

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    await waitForElementToBeRemoved(() => screen.queryByTestId("loading-spinner"));

    expect(screen.getByText("Unexpected error")).toBeInTheDocument();
  });

  it("navigate back to landing page when clicked on dismiss button on error dialog", async () => {
    renderMultiCompWithReduxAndRoute("/plan-generation/layout-plan-sheets/404", [
      { component: <PlanSheets />, route: "/plan-generation/layout-plan-sheets/:transactionId" },
      { component: <LandingPage />, route: "/plan-generation/:transactionId" },
    ]);

    await waitForElementToBeRemoved(() => screen.queryByTestId("loading-spinner"));
    expect(await screen.findByText("Unexpected error")).toBeInTheDocument();
    await userEvent.click(screen.getByText("Dismiss"));
    expect(await screen.findByRole("heading", { name: "Plan generation" })).toBeInTheDocument();
  });

  it("displays loading spinner while waiting for response", async () => {
    // response handler with delayed response
    server.use(
      rest.get(/\/plan\/123$/, (_, res, ctx) => res(ctx.status(200, "OK"), ctx.delay(2000), ctx.json(mockPlanData))),
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
});
