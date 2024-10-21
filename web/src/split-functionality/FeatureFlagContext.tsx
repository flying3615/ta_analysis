import { useUserProfile } from "@linz/lol-auth-js";
import { IBrowserSettings, MockedFeaturesMap } from "@splitsoftware/splitio/types/splitio.d";
import { SplitFactoryProvider } from "@splitsoftware/splitio-react";
import { ReactElement, useMemo } from "react";

import { mockedFeatureFlagsOn } from "@/split-functionality/FeatureFlags";

export function FeatureFlagProvider(props: {
  children: React.ReactNode;
  mockedFeatures?: MockedFeaturesMap;
}): ReactElement {
  const user = useUserProfile();

  const splitConfig = useMemo(() => {
    const authorizationKey = (window._env_ && window._env_.splitKey) ?? "";
    const config: IBrowserSettings = {
      core: {
        authorizationKey: authorizationKey,
        key: user?.id ?? "global",
      },
    };
    if (authorizationKey === "localhost") {
      /**
       * Sets up all featureflags to default to on when running localhost can be overridden using e.g:
       * const overrideLocalfeatures = {
       *   [FEATUREFLAGS.SURVEY_PLAN_GENERATION]: { treatment: TREATMENTS.OFF, config: null }
       * };
       */
      const overrideLocalFeatures = {};
      config.features = { ...(props.mockedFeatures ?? mockedFeatureFlagsOn()), ...overrideLocalFeatures };
    }
    return config;
  }, [props.mockedFeatures, user?.id]);

  return (
    <SplitFactoryProvider
      config={splitConfig}
      updateOnSdkReady={true}
      updateOnSdkUpdate={true}
      key={splitConfig.core.authorizationKey}
    >
      <>{props.children}</>
    </SplitFactoryProvider>
  );
}
