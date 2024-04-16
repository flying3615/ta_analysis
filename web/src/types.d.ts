declare const __BUILDDETAIL__: { buildVersion: string; buildTimestamp: string };

declare interface Window {
  _env_: {
    splitKey: string;
    oidcIssuer: string;
    basemapApiKey: string;
  };
  newrelic: typeof newrelic | undefined;
}
