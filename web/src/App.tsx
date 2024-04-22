import LandingPage from "@/components/LandingPage/LandingPage";
import { Route, Routes } from "react-router";
import { BrowserRouter } from "react-router-dom";
import { Paths } from "./Paths.ts";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags.ts";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags.ts";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";
import { LOLUserContextProviderV2 } from "@linz/landonline-common-js";
import { OidcConfig } from "@linz/lol-auth-js";
import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams.tsx";
import { LuiErrorPage, LuiLoadingSpinner, LuiStaticMessage } from "@linzjs/lui";

const Placeholder = (props: { name: string }) => <h2>{props.name} coming soon...</h2>;

export const PlangenApp = (props: { mockMap?: boolean }) => {
  const { result: isApplicationAvailable, loading: loadingApplicationAvailable } = useFeatureFlags(
    FEATUREFLAGS.SURVEY_PLAN_GENERATION,
  );

  if (loadingApplicationAvailable) {
    return <LuiLoadingSpinner />;
  }

  if (!isApplicationAvailable) {
    return (
      <LuiErrorPage
        content={
          <LuiStaticMessage level="error" closable={false}>
            <h2>You do not have access to this feature.</h2>
          </LuiStaticMessage>
        }
      />
    );
  }

  return (
    <Routes>
      <Route path={Paths.root} element={<LandingPage />} />
      <Route path={Paths.defineDiagrams} element={<DefineDiagrams mock={props.mockMap} />} />
      <Route path={Paths.layoutPlanSheets} element={<Placeholder name="Layout plan sheets" />} />
    </Routes>
  );
};

const App = () => {
  const oidcConfig: OidcConfig = {
    clientId: "survey-plangen-spa",
    issuerUri: window._env_.oidcIssuerUri,
    authzBaseUrl: window._env_.authzBaseUrl,
    postLoginUri: window.location.href,
    postLogoutUri: window.location.href,
  };

  return (
    <BrowserRouter>
      <LOLUserContextProviderV2 oidcConfig={oidcConfig}>
        <FeatureFlagProvider>
          <PlangenApp />
        </FeatureFlagProvider>
      </LOLUserContextProviderV2>
    </BrowserRouter>
  );
};

export default App;
