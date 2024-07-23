import { fireEvent, screen } from "@testing-library/react";

import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams.tsx";
import LandingPage from "@/components/LandingPage/LandingPage.tsx";
import PlanSheets from "@/components/PlanSheets/PlanSheets.tsx";
import { renderCompWithReduxAndRoute, renderMultiCompWithReduxAndRoute } from "@/test-utils/jest-utils";

describe("LandingPage", () => {
  it("should render Landing page", async () => {
    renderCompWithReduxAndRoute(<LandingPage />, "/plan-generation/123", "/plan-generation/:transactionId");

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
    expect(screen.getByRole("button", { name: "Diagrams icon Diagrams Dropdown icon" })).toBeTruthy();
  });

  it("should go to Layout Plan Sheets on click", async () => {
    renderMultiCompWithReduxAndRoute("/plan-generation/123", [
      { component: <LandingPage />, route: "/plan-generation/:transactionId" },
      { component: <PlanSheets />, route: "/plan-generation/layout-plan-sheets/:transactionId" },
    ]);

    const button = await screen.findByText("Layout Plan Sheets");
    fireEvent.click(button);
    expect(await screen.findByRole("heading", { name: /Title sheet diagrams/ })).toBeInTheDocument();
  });
});
