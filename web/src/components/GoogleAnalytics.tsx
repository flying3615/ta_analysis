import { useUserProfile } from "@linz/lol-auth-js";
import ReactGA from "react-ga4";

import { isInitialised } from "@/util/googleAnalyticsUtils";

export function GoogleAnalytics() {
  const user = useUserProfile();
  const idHash = user && user.id ? user.idHash : "global";
  try {
    if (isInitialised()) {
      const gaKey = window._env_?.gaKey;
      ReactGA.initialize(gaKey, {
        gaOptions: { userId: idHash },
      });
    }
  } catch (e) {
    console.error(e);
  }
  return <></>;
}
