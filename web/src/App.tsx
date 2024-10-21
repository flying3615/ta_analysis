import "@linzjs/step-ag-grid/dist/GridTheme.scss";
import "@linzjs/step-ag-grid/dist/index.css";
import "@linzjs/lui/dist/fonts";
import "@linzjs/lui/dist/scss/base.scss";

import { LOLUserContextProviderV2 } from "@linz/landonline-common-js";
import { OidcConfig, patchFetch, UserAccessesData, UserProfile } from "@linz/lol-auth-js";
import { MockUserContextProvider } from "@linz/lol-auth-js/mocks";
import { LuiErrorPage, LuiLoadingSpinner, LuiMessagingContextProvider, LuiStaticMessage } from "@linzjs/lui";
import { LuiModalAsyncContextProvider, PanelsContextProvider, useLuiModalPrefab } from "@linzjs/windows";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorInfo, ReactNode, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Provider } from "react-redux";
import { Route, useRouteError } from "react-router";
import { createBrowserRouter, createRoutesFromElements, RouterProvider } from "react-router-dom";

import { DefineDiagrams } from "@/components/DefineDiagrams/DefineDiagrams";
import { DefineDiagrams as DefineDiagramsOld } from "@/components/DefineDiagrams/DefineDiagramsOld";
import LandingPage from "@/components/LandingPage/LandingPage";
import { unhandledErrorModal } from "@/components/modals/unhandledErrorModal";
import PlanSheets from "@/components/PlanSheets/PlanSheets";
import { store } from "@/redux/store";
import { FeatureFlagProvider } from "@/split-functionality/FeatureFlagContext";
import { FEATUREFLAGS } from "@/split-functionality/FeatureFlags";
import useFeatureFlags from "@/split-functionality/UseFeatureFlags";

import { appClientId } from "./constants";
import { mockUser } from "./mocks/mockAuthUser";
import { RoutePaths } from "./Paths";

export const PlangenApp = (props: { mockMap?: boolean }) => {
  useEffect(() => {
    // we only patch fetch for secure-file-upload as other places to use addHeaders to add the token
    patchFetch((url) => url.includes("/v1/file-uploads"));
  });

  const { result: isApplicationAvailable, loading: loadingApplicationAvailable } = useFeatureFlags(
    FEATUREFLAGS.SURVEY_PLAN_GENERATION,
  );

  const { result: isDefineDiagramsOn, loading: isDefineDiagramsToggleLoading } = useFeatureFlags(
    FEATUREFLAGS.SURVEY_PLAN_GENERATION_DEFINE_DIAGRAMS,
  );
  if (loadingApplicationAvailable || isDefineDiagramsToggleLoading) {
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

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route>
          <Route path={RoutePaths.root}>
            <Route path="" element={<LandingPage />} ErrorBoundary={RouteErrorBoundary} />
            {isDefineDiagramsOn ? (
              <Route
                path={RoutePaths.defineDiagrams}
                element={<DefineDiagrams mock={props.mockMap} />}
                ErrorBoundary={RouteErrorBoundary}
              />
            ) : (
              <Route
                path={RoutePaths.defineDiagrams}
                element={<DefineDiagramsOld mock={props.mockMap} />}
                ErrorBoundary={RouteErrorBoundary}
              />
            )}
            <Route path={RoutePaths.layoutPlanSheets} element={<PlanSheets />} ErrorBoundary={RouteErrorBoundary} />
          </Route>
          <Route path="*" element={<NoMatchingRouteFound />} ErrorBoundary={RouteErrorBoundary} />
        </Route>
      </>,
    ),
  );

  return <RouterProvider router={router} />;
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

const errorHandler = (error: Error, info?: ErrorInfo) => {
  console.error(error, info);
  newrelic.noticeError(error);
};

const RouteErrorBoundary = () => {
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();
  const error = useRouteError() as Error;

  useEffect(() => {
    errorHandler(error);
    void showPrefabModal(unhandledErrorModal(error));
  }, [showPrefabModal, error]);

  return <div ref={modalOwnerRef} />;
};

const ShowUnhandledModal = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  const { showPrefabModal, modalOwnerRef } = useLuiModalPrefab();

  useEffect(() => {
    void showPrefabModal(unhandledErrorModal(error)).then(() => {
      resetErrorBoundary();
    });
  }, [showPrefabModal, error, resetErrorBoundary]);

  return <div ref={modalOwnerRef} />;
};

const commonDefaultOptions = {
  // Don't retry in storybook to avoid chromatic screenshot timing issues
  retry: window.isStorybook ? 0 : 2,
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      ...commonDefaultOptions,
    },
    mutations: {
      ...commonDefaultOptions,
    },
  },
});

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

  // There are two LuiModalAsyncContextProvider as ErrorBoundary uses it
  return (
    <LuiModalAsyncContextProvider>
      <ErrorBoundary FallbackComponent={ShowUnhandledModal} onError={errorHandler}>
        <LuiMessagingContextProvider version="v2">
          <AuthContextProvider>
            <FeatureFlagProvider>
              <QueryClientProvider client={queryClient}>
                <Provider store={store}>
                  <LuiModalAsyncContextProvider>
                    <PanelsContextProvider baseZIndex={500}>
                      <PlangenApp />
                    </PanelsContextProvider>
                  </LuiModalAsyncContextProvider>
                </Provider>
              </QueryClientProvider>
            </FeatureFlagProvider>
          </AuthContextProvider>
        </LuiMessagingContextProvider>
      </ErrorBoundary>
    </LuiModalAsyncContextProvider>
  );
};

export default App;
