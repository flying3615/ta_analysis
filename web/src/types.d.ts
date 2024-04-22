declare const __BUILDDETAIL__: { buildVersion: string; buildTimestamp: string };

declare interface Window {
  _env_: {
    splitKey: string;
    oidcIssuerUri: string;
    authzBaseUrl: string;
    basemapApiKey: string;
  };
  newrelic: typeof newrelic | undefined;
}
