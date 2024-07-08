import { LOLUserContextProviderV2 } from "@linz/landonline-common-js";
import { OidcConfig, UserAccessesData, UserProfile } from "@linz/lol-auth-js";
import { MockUserContextProvider } from "@linz/lol-auth-js/mocks";
import { LuiErrorPage, LuiLoadingSpinner, LuiStaticMessage } from "@linzjs/lui";
import { LuiModalAsyncContextProvider, useLuiModalPrefab } from "@linzjs/windows";
import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorInfo, ReactNode, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Provider } from "react-redux";
import { Route, Routes } from "react-router";
import { BrowserRouter } from "react-router-dom";

import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams.tsx";
import LandingPage from "@/components/LandingPage/LandingPage";
import { unhandledErrorModal } from "@/components/modals/unhandledErrorModal.tsx";
import PlanSheets from "@/components/PlanSheets/PlanSheets.tsx";
import { store } from "@/redux/store.ts";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext.tsx";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags.ts";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags.ts";

import { appClientId } from "./constants.tsx";
import { mockUser } from "./mocks/mockAuthUser.ts";
import { Paths } from "./Paths.ts";
import { queryClient } from "./queries/index.ts";

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
      <Route path="*" element={<NoMatchingRouteFound />} />
    </Routes>
  );
};

function NoMatchingRouteFound(): React.JSX.Element {
  return (
    <LuiErrorPage
      content={
        <LuiStaticMessage level="error" closable={false}>
          <h2>This page does not exist, please check the url and try again.</h2>
        </LuiStaticMessage>
      }
    />
  );
}

const errorHandler = (error: Error, info: ErrorInfo) => {
  console.error(error, info);
  newrelic.noticeError(error);
};

const ShowUnhandledModal = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

  useEffect(() => {
    showPrefabModal(unhandledErrorModal(error)).then(() => {
      resetErrorBoundary();
    });
  }, [showPrefabModal, error, resetErrorBoundary]);

  return <div ref={modalOwnerRef} />;
};

const App = () => {
  const oidcConfig: OidcConfig = {
    clientId: appClientId,
    issuerUri: window._env_.oidcIssuerUri,
    authzBaseUrl: window._env_.authzBaseUrl,
    postLoginUri: window.location.href,
    postLogoutUri: window.location.href,
  };

  interface AuthContextProviderProps {
    children: ReactNode;
    user?: UserProfile & UserAccessesData;
  }

  const AuthContextProvider = (props: AuthContextProviderProps) => {
    const mode = import.meta.env.MODE.toLowerCase();
    if (mode === "mock" || props.user) {
      return (
        <MockUserContextProvider user={mockUser}>
          <>{props.children}</>
        </MockUserContextProvider>
      );
    }

    return (
      <LOLUserContextProviderV2 oidcConfig={oidcConfig}>
        <>{props.children}</>
      </LOLUserContextProviderV2>
    );
  };

  return (
    <LuiModalAsyncContextProvider>
      <ErrorBoundary FallbackComponent={ShowUnhandledModal} onError={errorHandler}>
        <BrowserRouter>
          <AuthContextProvider>
            <FeatureFlagProvider>
              <QueryClientProvider client={queryClient}>
                <Provider store={store}>
                  <PlangenApp />
                </Provider>
              </QueryClientProvider>
            </FeatureFlagProvider>
          </AuthContextProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </LuiModalAsyncContextProvider>
  );
};

export default App;
