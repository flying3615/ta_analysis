import { MockUserContextProvider } from "@linz/lol-auth-js/mocks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";

import { PlangenApp } from "@/App";
import { singleFirmUserExtsurv1 } from "@/mocks/data/mockUsers";
import { setMockedSplitFeatures } from "@/setupTests";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext";
import { FEATUREFLAGS, TREATMENTS } from "@/split-functionality/FeatureFlags";

import { renderWithReduxProvider } from "./test-utils/jest-utils";

const queryClient = new QueryClient();

const renderPlangenApp = () => {
  renderWithReduxProvider(
    <MockUserContextProvider user={singleFirmUserExtsurv1} initialSelectedFirmId={singleFirmUserExtsurv1.firms[0]?.id}>
      <FeatureFlagProvider>
        <QueryClientProvider client={queryClient}>
          <PlangenApp mockMap={true} />
        </QueryClientProvider>
      </FeatureFlagProvider>
    </MockUserContextProvider>,
  );
};

const verifyAllRoutesRender = (before?: () => void) => {
  const validRoutes = [
    ["/plan-generation/123", "Plan generation"],
    ["/plan-generation/123/define-diagrams", "Diagrams"],
    ["/plan-generation/123/layout-plan-sheets", "Sheets"],
    ["/plan-generation/", "This page does not exist, please check the url and try again."],
    ["/plan-", "This page does not exist, please check the url and try again."],
  ];
  test.each(validRoutes)("verify route with %s", async (route, expected) => {
    before?.();
    window.history.pushState({}, "Test page", route);
    renderPlangenApp();
    expect(await screen.findByText(expected)).toBeTruthy();
  });
};

describe("Verify rendering of application", () => {
  verifyAllRoutesRender();
});

describe("Verify when locking is disabled app renders", () => {
  verifyAllRoutesRender(() => {
    setMockedSplitFeatures({
      [FEATUREFLAGS.SURVEY_PLAN_GENERATION_MAINTAIN_LOCKS]: TREATMENTS.OFF,
    });
  });
});
