declare const __BUILDDETAIL__: { buildVersion: string; buildTimestamp: string };

declare interface Window {
  _env_: {
    splitKey: string;
    oidcIssuerUri: string;
    apiGatewayBaseUrl: string;
    basemapApiKey: string;
  };
  newrelic: typeof newrelic | undefined;
}
