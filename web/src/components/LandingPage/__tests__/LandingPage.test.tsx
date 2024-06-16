import { fireEvent, screen } from "@testing-library/react";
import { renderCompWithReduxAndRoute, renderMultiCompWithReduxAndRoute } from "@/test-utils/jest-utils";
import LandingPage from "@/components/LandingPage/LandingPage.tsx";
import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams.tsx";
import PlanSheets from "@/components/PlanSheets/PlanSheets.tsx";

describe("LandingPage", () => {
  it("should render Landing page", async () => {
    renderCompWithReduxAndRoute(<LandingPage />);

    expect(await screen.findByRole("heading", { name: "Plan generation" })).toBeInTheDocument();
    expect(screen.getByText(/^Define Diagrams$/)).toBeTruthy();
    expect(screen.getByText(/^Layout Plan Sheets$/)).toBeTruthy();
    expect(
      screen.getByText(/Find Maintain Diagram Layers and Preferences in Define Diagrams and Layout Plan Sheets/),
    ).toBeTruthy();
  });

  it("should go to Define Diagrams on click", async () => {
    renderMultiCompWithReduxAndRoute("/plan-generation/123", [
      { component: <LandingPage />, route: "/plan-generation/:transactionId" },
      { component: <DefineDiagrams />, route: "/plan-generation/define-diagrams/:transactionId" },
    ]);

    const button = await screen.findByText("Define Diagrams");
    fireEvent.click(button);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Diagrams icon Diagrams Dropdown icon" })).toBeTruthy();
  });

  it("should show application error when Define Diagrams clicked on plan not ready for layout", async () => {
    renderMultiCompWithReduxAndRoute("/plan-generation/666", [
      { component: <LandingPage />, route: "/plan-generation/:transactionId" },
      { component: <PlanSheets />, route: "/plan-generation/layout-plan-sheets/:transactionId" },
    ]);

    const button = await screen.findByText("Define Diagrams");
    fireEvent.click(button);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(await screen.findByText("Error preparing dataset")).toBeInTheDocument();
    expect(screen.getByText(/20001/)).toBeInTheDocument();
    expect(screen.getByText(/prepare dataset application error/)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Plan generation" })).toBeInTheDocument();
  });

  it("should show unexpected error when Define Diagrams clicked on non-existent plan", async () => {
    renderMultiCompWithReduxAndRoute("/plan-generation/404", [
      { component: <LandingPage />, route: "/plan-generation/:transactionId" },
      { component: <PlanSheets />, route: "/plan-generation/layout-plan-sheets/:transactionId" },
    ]);

    const button = await screen.findByText("Define Diagrams");
    fireEvent.click(button);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(await screen.findByText("Unexpected error")).toBeInTheDocument();
    expect(screen.getByText(/Detailed error information/)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Plan generation" })).toBeInTheDocument();
  });

  it("should go to Layout Plan Sheets on click", async () => {
    renderMultiCompWithReduxAndRoute("/plan-generation/123", [
      { component: <LandingPage />, route: "/plan-generation/:transactionId" },
      { component: <PlanSheets />, route: "/plan-generation/layout-plan-sheets/:transactionId" },
    ]);

    const button = await screen.findByText("Layout Plan Sheets");
    fireEvent.click(button);
    expect(await screen.findByRole("heading", { name: /Survey sheet diagrams/ })).toBeInTheDocument();
  });
});
