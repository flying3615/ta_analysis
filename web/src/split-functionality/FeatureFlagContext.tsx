import { useUserProfile } from "@linz/lol-auth-js";
import { IBrowserSettings, MockedFeaturesMap } from "@splitsoftware/splitio/types/splitio.d";
import { SplitFactoryProvider } from "@splitsoftware/splitio-react";
import { ReactElement } from "react";

import { mockedFeatureFlagsOn } from "@/split-functionality/FeatureFlags.ts";

export function FeatureFlagProvider(props: {
  children: React.ReactNode;
  mockedFeatures?: MockedFeaturesMap;
}): ReactElement {
  const user = useUserProfile();

  const authorizationKey = (window._env_ && window._env_.splitKey) ?? "";

  const splitConfig: IBrowserSettings = {
    core: {
      authorizationKey,
      key: user && user.id ? user.id : "global",
    },
  };

  if (authorizationKey === "localhost") {
    /** sets up all featureflags to default to on when running localhost
     can be overridden using e.g:
     const overrideLocalfeatures = {
     [FEATUREFLAGS.SURVEY_PLAN_GENERATION]: { treatment: TREATMENTS.OFF, config: null }
     };
     */
    const overrideLocalfeatures = {};

    splitConfig.features = { ...(props.mockedFeatures ?? mockedFeatureFlagsOn()), ...overrideLocalfeatures };
  }

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
