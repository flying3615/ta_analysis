import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";

import { PlangenApp } from "@/App.tsx";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";

import { renderWithReduxProvider } from "./test-utils/jest-utils.tsx";

const queryClient = new QueryClient();

const renderPlangenApp = () => {
  renderWithReduxProvider(
    <FeatureFlagProvider>
      <QueryClientProvider client={queryClient}>
        <PlangenApp mockMap={true} />
      </QueryClientProvider>
    </FeatureFlagProvider>,
  );
};

describe("Verify rendering of application", () => {
  const validRoutes = [
    ["/plan-generation/123", "Plan generation"],
    ["/plan-generation/define-diagrams/123", "Diagrams"],
    ["/plan-generation/layout-plan-sheets/123", "Sheets"],
    ["/plan-generation/", "This page does not exist, please check the url and try again."],
    ["/plan-", "This page does not exist, please check the url and try again."],
  ];
  test.each(validRoutes)("verify route with %s", async (route, expected) => {
    window.history.pushState({}, "Test page", route);
    renderPlangenApp();
    expect(await screen.findByText(expected)).toBeTruthy();
  });
});
