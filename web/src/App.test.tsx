import { renderWithReduxProvider } from "./test-utils/jest-utils.tsx";
import { screen } from "@testing-library/react";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";
import { MemoryRouter } from "react-router";
import { PlangenApp } from "@/App.tsx";
const renderPlangenApp = (url: string) => {
  renderWithReduxProvider(
    <FeatureFlagProvider>
      <MemoryRouter initialEntries={[url]}>
        <PlangenApp mockMap={true} />
      </MemoryRouter>
    </FeatureFlagProvider>,
  );
};

describe("Verify rendering of application", () => {
  const validRoutes = [
    ["/plan-generation/123", "Plan generation"],
    ["/plan-generation/", "Plan generation"],
    ["/plan-generation/define-diagrams/123", "Diagrams"],
    ["/plan-generation/layout-plan-sheets/123", "Sheets"],
    ["/plan-", "This page does not exist, please check the url and try again."],
  ];
  test.each(validRoutes)("verify route with %s", async (route, expected) => {
    renderPlangenApp(route);
    expect(await screen.findByText(expected)).toBeTruthy();
  });
});
