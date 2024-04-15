import LandingPage from "@/components/LandingPage/LandingPage";
import { Route, Routes } from "react-router";
import { BrowserRouter } from "react-router-dom";
import { Paths } from "./Paths.ts";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags.ts";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags.ts";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";

const Placeholder = (props: { name: string }) => <h2>{props.name} coming soon...</h2>;

export const PlangenApp = () => {
  const { result: isApplicationAvailable, loading: loadingApplicationAvailable } = useFeatureFlags(
    FEATUREFLAGS.SURVEY_PLAN_GENERATION,
  );

  if (loadingApplicationAvailable) {
    return <></>; // avoid flicker
  }

  if (!isApplicationAvailable) {
    return <h2>You do not have access to this feature.</h2>;
  }

  return (
    <Routes>
      <Route path={Paths.root} element={<LandingPage />} />
      <Route path={Paths.defineDiagrams} element={<Placeholder name={"Define diagrams"} />} />
      <Route path={Paths.layoutPlanSheets} element={<Placeholder name={"Layout plan sheets"} />} />
    </Routes>
  );
};

const App = () => {
  return (
    <FeatureFlagProvider>
      <BrowserRouter>
        <PlangenApp />
      </BrowserRouter>
    </FeatureFlagProvider>
  );
};

export default App;
