import { Route } from "react-router";
import { Routes } from "react-router-dom";

import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams";
import LandingPage from "@/components/LandingPage/LandingPage";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { NoMatchingRouteFound } from "@/NoMatchingRouteFound";
import { RoutePaths } from "@/Paths";
import { useCreateAndMaintainLock } from "@/queries/useCreateAndMaintainLock";
import { RouteErrorBoundary } from "@/RouteErrorBoundary";

import { useTransactionId } from "./hooks/useTransactionId";
import { useSurveyDocumentTitle } from "./queries/survey";

export const AppSubRoutes = (props: { mockMap?: boolean }) => {
  const { lockPreviouslyHeld } = useCreateAndMaintainLock();
  const transactionId = useTransactionId();
  useSurveyDocumentTitle(transactionId);

  // Prevent the sub-pages from loading until we are sure we have an initial lock
  // Plan-gen will exception if it executes before there is a lock
  // This occurs if the Layout PlanSheets/Diagrams page url is entered directly, or on refresh of a window
  if (!lockPreviouslyHeld) {
    return <></>;
  }

  return (
    <Routes>
      <Route path="" element={<LandingPage />} ErrorBoundary={RouteErrorBoundary} />
      <Route
        path={RoutePaths.defineDiagrams}
        element={<DefineDiagrams mock={props.mockMap} />}
        ErrorBoundary={RouteErrorBoundary}
      />
      <Route path={RoutePaths.layoutPlanSheets} element={<PlanSheets />} ErrorBoundary={RouteErrorBoundary} />
      <Route path="*" element={<NoMatchingRouteFound />} ErrorBoundary={RouteErrorBoundary} />
    </Routes>
  );
};
