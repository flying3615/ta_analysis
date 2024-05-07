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
import PlanSheets from "@/components/PlanSheets/PlanSheets.tsx";
import { Provider } from "react-redux";
import { store } from "./redux/store.ts";

export const appClientId = "survey-plangen-spa";

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
      <Route path={Paths.layoutPlanSheets} element={<PlanSheets />} />
    </Routes>
  );
};

const App = () => {
  const oidcConfig: OidcConfig = {
    clientId: appClientId,
    issuerUri: window._env_.oidcIssuerUri,
    authzBaseUrl: window._env_.authzBaseUrl,
    postLoginUri: window.location.href,
    postLogoutUri: window.location.href,
  };

  return (
    <BrowserRouter>
      <LOLUserContextProviderV2 oidcConfig={oidcConfig}>
        <FeatureFlagProvider>
          <Provider store={store}>
            <PlangenApp />
          </Provider>
        </FeatureFlagProvider>
      </LOLUserContextProviderV2>
    </BrowserRouter>
  );
};

export default App;
